const ta = require('technicalindicators');

const utils = require('../utils');
const candleSticks = require('../../api/candleSticks');
const limitOrder = require('../../api/limitOrder');
const ocoOrder = require('../../api/ocoOrder');

let inLongPosition = false;
let inShortPosition = false;

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

  if (inputRsi.values.length > inputRsi.period) {
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
    const aboveEma = close > latestEma200 && close > latestEma50;
    const belowEma = close < latestEma200 && close < latestEma50;

    if (isMarketTrending && aboveEma && utils.getHiddenBullishDivergence(lows, rsi) && stochasticCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here

        const limitPrice = utils.format(close + ((close - utils.getSwingLow(lows)) * 2), 2);
        const stopPrice = utils.format(utils.getSwingLow(lows) - 0.02, 2);
        const stopLimitPrice = utils.format(utils.getSwingLow(lows) - 0.03, 2);
        limitOrder('BTCUSDT', 'BUY', 0.001, close);
        ocoOrder('BTCUSDT', 'SELL', 0.001, limitPrice, stopPrice, stopLimitPrice);
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (isMarketTrending && belowEma && utils.getHiddenBearishDivergence(highs, rsi) && stochasticCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here

        const limitPrice = utils.format(close - ((utils.getSwingHigh(highs) - close) * 2), 2);
        const stopPrice = utils.format(utils.getSwingHigh(highs) + 0.02, 2);
        const stopLimitPrice = utils.format(utils.getSwingHigh(highs) + 0.03, 2);
        limitOrder('BTCUSDT', 'SELL', 0.001, close);
        ocoOrder('BTCUSDT', 'BUY', 0.001, limitPrice, stopPrice, stopLimitPrice);
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = doubleEmaRsiStochasticStrategy;
