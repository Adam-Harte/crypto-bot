const ta = require('technicalindicators');

const utils = require('./utils');
const api = require('../testApi');

let inLongPosition = false;
let inShortPosition = false;

const inputEma8 = {
  period: 8,
  values: []
};

const inputEma14 = {
  period: 14,
  values: []
};

const inputEma50 = {
  period: 50,
  values: []
};

const inputStochastic = {
  values: [],
  rsiPeriod: 14,
  stochasticPeriod: 14,
  kPeriod: 3,
  dPeriod: 3
};

const inputAtr = {
  high: [],
  low: [],
  close: [],
  period: 14,
  format: v => parseFloat(v.toPrecision(8))
};

// api.getCandleSticks('BTCUSDT', '1h', 50).then(res => {
//   inputEma8.values = res.data.map(d => parseFloat(d[4]));
//   inputEma14.values = res.data.map(d => parseFloat(d[4]));
//   inputEma50.values = res.data.map(d => parseFloat(d[4]));

//   inputStochastic.values = res.data.map(d => parseFloat(d[4]));

//   inputAtr.high = res.data.map(d => parseFloat(d[2]));
//   inputAtr.low = res.data.map(d => parseFloat(d[3]));
//   inputAtr.close = res.data.map(d => parseFloat(d[4]));
// });

const emaStochasticAtrStrategy = (high, low, close) => {
  inputEma8.values.push(close);
  inputEma14.values.push(close);
  inputEma50.values.push(close);
  inputStochastic.values.push(close);
  inputAtr.high.push(high);
  inputAtr.low.push(low);
  inputAtr.close.push(close);

  if (inputEma50.values.length > inputEma50.period) {
    const ema8 = new ta.EMA.calculate(inputEma8);
    const ema14 = new ta.EMA.calculate(inputEma14);
    const ema50 = new ta.EMA.calculate(inputEma50);
    const stochastic = new ta.StochasticRSI.calculate(inputStochastic);
    const atr = new ta.ATR.calculate(inputAtr);

    const latestEma8 = ema8[ema8.length - 1];
    const latestEma14 = ema14[ema14.length - 1];
    const latestEma50 = ema50[ema50.length - 1];
    const previousStochastic = stochastic[stochastic.length - 2];
    const latestStochastic = stochastic[stochastic.length - 1];
    const latestAtr = atr[atr.length - 1];

    const emaUpwardTrend = latestEma8 > latestEma14 && latestEma14 > latestEma50;
    const stochasticCrossUp = previousStochastic.k < previousStochastic.d && latestStochastic.k > latestStochastic.d;
    const emaDownwardTrend = latestEma50 > latestEma14 && latestEma14 > latestEma8;
    const stochasticCrossDown = previousStochastic.k > previousStochastic.d && latestStochastic.k < latestStochastic.d;

    if (emaUpwardTrend && stochasticCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 2)));
        console.log('stop price: ', utils.format(close - (utils.getAtrTicks(latestAtr, 0.01) * 3)));
        console.log('stop limit price: ', utils.format(close - (utils.getAtrTicks(latestAtr, 0.01) * 3) - 0.02));
        console.log('atr', utils.getAtrTicks(latestAtr, 0.01));
        // api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'SELL', 0.2, utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 2)), utils.format(close - (utils.getAtrTicks(latestAtr, 0.01)) * 3), utils.format(close - (utils.getAtrTicks(latestAtr, 0.01)) * 3 - 0.02));
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (emaDownwardTrend && stochasticCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', utils.format(close - (utils.getAtrTicks(latestAtr, 0.01) * 2)));
        console.log('stop price: ', utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 3)));
        console.log('stop limit price: ', utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 3) + 0.02));
        console.log('atr', utils.getAtrTicks(latestAtr, 0.01));
        // api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'BUY', 0.2, utils.format(close - (utils.getAtrTicks(latestAtr, 0.01) * 2)), utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 3)), utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 3) + 0.03));
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = emaStochasticAtrStrategy;
