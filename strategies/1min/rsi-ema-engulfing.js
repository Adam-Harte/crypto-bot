const ta = require('technicalindicators');

const utils = require('../utils');
const account = require('../../api/account');
const exchangeInfo = require('../../api/exchangeInfo');
const candleSticks = require('../../api/candleSticks');
const limitOrder = require('../../api/limitOrder');
const ocoOrder = require('../../api/ocoOrder');
const queryOco = require('../../api/queryOco');

let inLongPosition = false;
let inShortPosition = false;
let balance = 0;
let orderListId = 0;
let orderQuantity = 0;
let tickPrecision = 0;

const inputEma200 = {
  period: 200,
  values: []
};

const inputRsi = {
  values: [],
  period: 14
};

let opens = [];
let closes = [];

exchangeInfo('BTCUSDT').then(res => {
  const filters = res.data.symbols[0].filters;
  const priceFilter = filters.find(filter => filter.filterType === 'PRICE_FILTER');
  tickPrecision = utils.getTickSizePrecision(priceFilter.tickSize);
});

candleSticks('BTCUSDT', '1m', 200).then(res => {
  inputEma200.values = res.data.map(d => parseFloat(d[4]));
  inputRsi.values = res.data.map(d => parseFloat(d[4]));

  closes = res.data.map(d => parseFloat(d[4]));
  opens = res.data.map(d => parseFloat(d[1]));
});

const rsiEmaEngulfingStrategy = (open, high, low, close) => {
  inputEma200.values.push(close);
  inputRsi.values.push(close);
  closes.push(close);
  opens.push(open);

  if (inputRsi.values.length > inputRsi.period) {
    const ema200 = new ta.EMA.calculate(inputEma200);
    const rsi = new ta.RSI.calculate(inputRsi);

    const latestEma200 = ema200[ema200.length - 1];
    const latestRsi = rsi[rsi.length - 1];
    const oldClose = closes[closes.length - 3];
    const previousClose = closes[closes.length - 2];
    const latestClose = closes[closes.length - 1];
    const oldOpen = opens[opens.length - 3];
    const previousOpen = opens[opens.length - 2];
    const latestOpen = opens[opens.length - 1];

    const rsiAbove = latestRsi > 50;
    const rsiBelow = latestRsi < 50;
    const aboveEma = close > latestEma200;
    const belowEma = close < latestEma200;
    const greenEngulfing = utils.getBullishEngulfing(oldOpen, oldClose, previousOpen, previousClose, latestOpen, latestClose);
    const redEngulfing = utils.getBearishEngulfing(oldOpen, oldClose, previousOpen, previousClose, latestOpen, latestClose);

    utils.logPriceAction(open, high, low, close);

    if (inLongPosition || inShortPosition) {
      queryOco(orderListId).then(res => {
        inLongPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
        inShortPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
      })
    }

    if (aboveEma && rsiAbove && greenEngulfing) {
      if (!inLongPosition) {
        // buy binance order logic here
        const limitPrice = utils.format(close + ((close - low) * 2), tickPrecision);
        const stopPrice = utils.format(low - 10, tickPrecision);
        const stopLimitPrice = utils.format(low - 10 - 0.02, tickPrecision);

        utils.logPosition('Long', limitPrice, stopPrice, stopLimitPrice);

        if (utils.isProfitCoveringTradeFee('LONG', limitPrice, close)) {
          account()
            .then(acc => {
              balance = parseFloat(acc.data.balances.find(b => b.asset === 'USDT').free);
              orderQuantity = utils.getOrderQuantity(balance, 0.01, close);
              return limitOrder('BTCUSDT', 'BUY', orderQuantity, close);
            }).then(order => {
              return ocoOrder('BTCUSDT', 'SELL', orderQuantity, limitPrice, stopPrice, stopLimitPrice);
            })
            .then(ocoOrder => {
              orderListId = ocoOrder.data.orderListId;
              inLongPosition = true;
            });
        }
      }
    }

    if (belowEma && rsiBelow && redEngulfing) {
      if (!inShortPosition) {
        // sell binance order logic here
        const limitPrice = utils.format(close - ((high - close) * 2), tickPrecision);
        const stopPrice = utils.format(high + 10, tickPrecision);
        const stopLimitPrice = utils.format(high + 10 + 0.02, tickPrecision);

        utils.logPosition('Short', limitPrice, stopPrice, stopLimitPrice);

        if (utils.isProfitCoveringTradeFee('SHORT', limitPrice, close)) {
          account()
            .then(acc => {
              balance = parseFloat(acc.data.balances.find(b => b.asset === 'USDT').free);
              orderQuantity = utils.getOrderQuantity(balance, 0.01, close);
              return limitOrder('BTCUSDT', 'SELL', orderQuantity, close);
            })
            .then(order => {
              return ocoOrder('BTCUSDT', 'BUY', orderQuantity, limitPrice, stopPrice, stopLimitPrice);
            })
            .then(ocoOrder => {
              orderListId = ocoOrder.data.orderListId;
              inShortPosition = true;
            });
        }
      }
    }
  }
}

module.exports = rsiEmaEngulfingStrategy;
