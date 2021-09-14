const ta = require('technicalindicators');

const utils = require('./utils');
const candleSticks = require('../api/candleSticks');
const limitOrder = require('../api/limitOrder');
const ocoOrder = require('../api/ocoOrder');

let inLongPosition = false;
let inShortPosition = false;

const inputEma200 = {
  period: 200,
  values: []
};

const inputMoneyFlow = {
  high: [],
  low: [],
  close: [],
  volume: [],
  period: 14
};

const inputStochastic = {
  high: [],
  low: [],
  close: [],
  period: 14,
  signalPeriod: 3
};

const inputAtr = {
  high: [],
  low: [],
  close: [],
  period: 14
};

let lows = [];
let highs = [];

candleSticks('BTCUSDT', '1d', 200).then(res => {
  inputEma200.values = res.data.map(d => parseFloat(d[4]));

  inputStochastic.high = res.data.map(d => parseFloat(d[2]));
  inputStochastic.low = res.data.map(d => parseFloat(d[3]));
  inputStochastic.close = res.data.map(d => parseFloat(d[4]));

  inputMoneyFlow.high = res.data.map(d => parseFloat(d[2]));
  inputMoneyFlow.low = res.data.map(d => parseFloat(d[3]));
  inputMoneyFlow.close = res.data.map(d => parseFloat(d[4]));
  inputMoneyFlow.volume = res.data.map(d => parseFloat(d[5]));

  inputAtr.high = res.data.map(d => parseFloat(d[2]));
  inputAtr.low = res.data.map(d => parseFloat(d[3]));
  inputAtr.close = res.data.map(d => parseFloat(d[4]));

  lows = res.data.map(d => parseFloat(d[3]));
  highs = res.data.map(d => parseFloat(d[2]));
});

const emaStochasticMoneyflowStrategy = (high, low, close, volume) => {
  inputMoneyFlow.high.push(high);
  inputMoneyFlow.low.push(low);
  inputMoneyFlow.close.push(close);
  inputMoneyFlow.volume.push(volume);
  inputEma200.values.push(close);
  inputStochastic.high.push(high);
  inputStochastic.low.push(low);
  inputStochastic.close.push(close);
  inputAtr.high.push(high);
  inputAtr.low.push(low);
  inputAtr.close.push(close);
  lows.push(low);
  highs.push(high);

  if (inputEma200.values.length > inputEma200.period) {
    const ema200 = new ta.EMA.calculate(inputEma200);
    const stochastic = new ta.Stochastic.calculate(inputStochastic);
    const moneyFlow = new ta.MFI.calculate(inputMoneyFlow);
    const atr = new ta.ATR.calculate(inputAtr);

    const latestEma200 = ema200[ema200.length - 1];
    const latestStochastic = stochastic[stochastic.length - 1];
    const latestMoneyFlow = moneyFlow[moneyFlow.length - 1];
    const latestAtr = atr[atr.length - 1];

    const aboveStochastic = latestStochastic.k > 95;
    const belowStochastic = latestStochastic < 5;
    const aboveEma = close > latestEma200;
    const belowEma = close < latestEma200;
    const moneyFlowUpwardTrend = latestMoneyFlow > 50;
    const moneyFlowDownwardTrend = latestMoneyFlow < 50;

    if (aboveEma && utils.getHiddenBullishDivergence(lows, stochastic.map(s => s.k)) && aboveStochastic && moneyFlowUpwardTrend) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', utils.format(close + (close - (close - latestAtr * 1.5)) * 2, 2));
        console.log('stop price: ', utils.format(close - latestAtr * 1.5, 2));
        console.log('stop limit price: ', utils.format(close - latestAtr * 1.5 - 0.02, 2));
        limitOrder('BTCUSDT', 'BUY', 0.001, close);
        ocoOrder('BTCUSDT', 'SELL', 0.001, utils.format(close + ((close - utils.getSwingLow(lows)) * 2), 2), utils.format(utils.getSwingLow(lows) - 0.02, 2), utils.format(utils.getSwingLow(lows) - 0.03, 2));
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (belowEma && utils.getHiddenBearishDivergence(highs, stochastic.map(s => s.k)) && belowStochastic && moneyFlowDownwardTrend) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', utils.format(close - ((close + latestAtr * 1.5) - close) * 2, 2));
        console.log('stop price: ', utils.format(close + latestAtr * 1.5, 2));
        console.log('stop limit price: ', utils.format(close + latestAtr * 1.5 + 0.02, 2));
        limitOrder('BTCUSDT', 'SELL', 0.001, close);
        ocoOrder('BTCUSDT', 'BUY', 0.001, utils.format(close - ((utils.getSwingHigh(highs) - close) * 2), 2), utils.format(utils.getSwingHigh(highs) + 0.02, 2), utils.format(utils.getSwingHigh(highs) + 0.03, 2));
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = emaStochasticMoneyflowStrategy;
