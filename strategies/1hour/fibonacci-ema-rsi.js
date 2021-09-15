const ta = require('technicalindicators');
const { getFibRetracement } = require('fib-retracement');

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

const inputEma = {
  period: 50,
  values: []
};

const inputRsi = {
  values: [],
  period: 14
};

let opens = [];
let highs = [];
let lows = [];
let closes = [];

exchangeInfo('BTCUSDT').then(res => {
  const filters = res.data.symbols[0].filters;
  const priceFilter = filters.find(filter => filter.filterType === 'PRICE_FILTER');
  tickPrecision = utils.getTickSizePrecision(priceFilter.tickSize);
});

candleSticks('BTCUSDT', '1h', 200).then(res => {
  inputEma.values = res.data.map(d => parseFloat(d[4]));
  inputRsi.values = res.data.map(d => parseFloat(d[4]));

  opens = res.data.map(d => parseFloat(d[1]));
  highs = res.data.map(d => parseFloat(d[2]));
  lows = res.data.map(d => parseFloat(d[3]));
  closes = res.data.map(d => parseFloat(d[4]));
});

const fibonacciEmaRsiStrategy = (open, high, low, close) => {
  inputEma.values.push(close);
  inputRsi.values.push(close);
  opens.push(open);
  highs.push(high);
  lows.push(low);
  closes.push(close);

  if (inputRsi.values.length > inputRsi.period) {
    const ema = new ta.EMA.calculate(inputEma200);
    const rsi = new ta.RSI.calculate(inputRsi);
    const fib = getFibRetracement({ levels: { 0: Math.max(...highs.slice(highs.length - 14)), 1: Math.min(...lows.slice(lows.length - 14)) } });

    const latestEma = ema[ema.length - 1];
    const previousClose = closes[closes.length - 2];
    const latestClose = closes[closes.length - 1];
    const previousOpen = opens[opens.length - 2];
    const latestOpen = opens[opens.length - 1];

    const bullishDivergence = utils.getHiddenBullishDivergence(lows, rsi);
    const BearishDivergence = utils.getHiddenBearishDivergence(highs, rsi);
    const aboveEma = low > latestEma;
    const belowEma = high < latestEma;
    const aboveFib = close > fib['0.5'];
    const belowFib = close < fib['0.5'];
    const greenEngulfing = utils.getBullishEngulfing(previousOpen, previousClose, latestOpen, latestClose);
    const redEngulfing = utils.getBearishEngulfing(previousOpen, previousClose, latestOpen, latestClose);

    if (inLongPosition || inShortPosition) {
      queryOco(orderListId).then(res => {
        inLongPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
        inShortPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
      })
    }

    if (belowEma && bullishDivergence && belowFib && greenEngulfing) {
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

    if (aboveEma && BearishDivergence && aboveFib && redEngulfing) {
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

module.exports = fibonacciEmaRsiStrategy;
