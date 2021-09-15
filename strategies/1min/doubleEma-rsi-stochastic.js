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

const inputEma50 = {
  period: 50,
  values: []
};

const inputRsi = {
  values: [],
  period: 14
};

const inputStochastic = {
  high: [],
  low: [],
  close: [],
  period: 14,
  signalPeriod: 3
};

let lows = [];
let highs = [];

exchangeInfo('BTCUSDT').then(res => {
  const filters = res.data.symbols[0].filters;
  const priceFilter = filters.find(filter => filter.filterType === 'PRICE_FILTER');
  tickPrecision = utils.getTickSizePrecision(priceFilter.tickSize);
});

candleSticks('BTCUSDT', '1m', 200).then(res => {
  inputEma200.values = res.data.map(d => parseFloat(d[4]));
  inputEma50.values = res.data.map(d => parseFloat(d[4]));

  inputStochastic.high = res.data.map(d => parseFloat(d[2]));
  inputStochastic.low = res.data.map(d => parseFloat(d[3]));
  inputStochastic.close = res.data.map(d => parseFloat(d[4]));

  inputRsi.values = res.data.map(d => parseFloat(d[4]));

  lows = res.data.map(d => parseFloat(d[3]));
  highs = res.data.map(d => parseFloat(d[2]));
});

const doubleEmaRsiStochasticStrategy = (high, low, close) => {
  inputEma200.values.push(close);
  inputEma50.values.push(close);
  inputStochastic.high.push(high);
  inputStochastic.low.push(low);
  inputStochastic.close.push(close);
  inputRsi.values.push(close);
  lows.push(low);
  highs.push(high);

  if (inputEma200.values.length > inputEma200.period) {
    const ema200 = new ta.EMA.calculate(inputEma200);
    const ema50 = new ta.EMA.calculate(inputEma50);
    const stochastic = new ta.Stochastic.calculate(inputStochastic);
    const rsi = new ta.RSI.calculate(inputRsi);

    const latestEma200 = ema200[ema200.length - 1];
    const latestEma50 = ema200[ema50.length - 1];
    const previousStochastic = stochastic[stochastic.length - 2];
    const latestStochastic = stochastic[stochastic.length - 1];

    const isMarketTrending = (latestEma200 - 100) > latestEma50 || (latestEma200 + 100) < latestEma50;
    const stochasticCrossUp = previousStochastic.k < previousStochastic.d && latestStochastic.k > latestStochastic.d;
    const stochasticCrossDown = previousStochastic.k > previousStochastic.d && latestStochastic.k < latestStochastic.d;
    const aboveEma = low > latestEma200 && low > latestEma50;
    const belowEma = high < latestEma200 && high < latestEma50;

    if (inLongPosition || inShortPosition) {
      queryOco(orderListId).then(res => {
        inLongPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
        inShortPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
      })
    }

    if (isMarketTrending && aboveEma && utils.getHiddenBullishDivergence(lows, rsi) && stochasticCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here
        const limitPrice = utils.format(close + ((close - utils.getSwingLow(lows)) * 2), tickPrecision);
        const stopPrice = utils.format(utils.getSwingLow(lows) - 0.02, tickPrecision);
        const stopLimitPrice = utils.format(utils.getSwingLow(lows) - 0.03, tickPrecision);
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

    if (isMarketTrending && belowEma && utils.getHiddenBearishDivergence(highs, rsi) && stochasticCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here
        const limitPrice = utils.format(close - ((utils.getSwingHigh(highs) - close) * 2), tickPrecision);
        const stopPrice = utils.format(utils.getSwingHigh(highs) + 0.02, tickPrecision);
        const stopLimitPrice = utils.format(utils.getSwingHigh(highs) + 0.03, tickPrecision);
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

module.exports = doubleEmaRsiStochasticStrategy;
