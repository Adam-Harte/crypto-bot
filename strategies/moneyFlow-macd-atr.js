const ta = require('technicalindicators');

const utils = require('./utils');
const api = require('../testApi');

let inLongPosition = false;
let inShortPosition = false;

const inputMoneyFlow = {
  high: [],
  low: [],
  close: [],
  volume: [],
  period: 14
};

const inputMacd = {
  values: [],
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
};

const inputAtr = {
  high: [],
  low: [],
  close: [],
  period: 14
};

// api.getCandleSticks('BTCUSDT', '1h', 50).then(res => {
//   inputMoneyFlow.high = res.data.map(d => parseFloat(d[2]));
//   inputMoneyFlow.low = res.data.map(d => parseFloat(d[3]));
//   inputMoneyFlow.close = res.data.map(d => parseFloat(d[4]));
//   inputMoneyFlow.volume = res.data.map(d => parseFloat(d[5]));

//   inputMacd.values = res.data.map(d => parseFloat(d[4]));

//   inputAtr.high = res.data.map(d => parseFloat(d[2]));
//   inputAtr.low = res.data.map(d => parseFloat(d[3]));
//   inputAtr.close = res.data.map(d => parseFloat(d[4]));
// });

const moneyFlowMacdAtrStrategy = (high, low, close, volume) => {
  inputMoneyFlow.high.push(high);
  inputMoneyFlow.low.push(low);
  inputMoneyFlow.close.push(close);
  inputMoneyFlow.volume.push(volume);

  inputMacd.values.push(close);

  inputAtr.high.push(high);
  inputAtr.low.push(low);
  inputAtr.close.push(close);

  if (inputMacd.values.length > inputMacd.slowPeriod) {
    const moneyFlow = new ta.MFI.calculate(inputMoneyFlow);
    const macd = new ta.MACD.calculate(inputMacd);
    const atr = new ta.ATR.calculate(inputAtr);

    const latestMoneyFlow = moneyFlow[moneyFlow.length - 1];
    const previousMacd = macd[macd.length - 2];
    const latestMacd = macd[macd.length - 1];
    const latestAtr = atr[atr.length - 1];

    const moneyFlowUpwardTrend = latestMoneyFlow > 50;
    const moneyFlowDownwardTrend = latestMoneyFlow < 50;
    const macdCrossUp = previousMacd.MACD < previousMacd.signal && latestMacd.MACD > latestMacd.signal && latestMacd.histogram > 1;
    const macdCrossDown = previousMacd.MACD > previousMacd.signal && latestMacd.MACD < latestMacd.signal && latestMacd.histogram < 1;

    if (moneyFlowUpwardTrend && macdCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 1.5)));
        console.log('stop price: ', utils.format(close - (utils.getAtrTicks(latestAtr, 0.01) * 2)));
        console.log('stop limit price: ', utils.format(close - (utils.getAtrTicks(latestAtr, 0.01) * 2) - 0.02));
        console.log('atr', utils.getAtrTicks(latestAtr, 0.01));
        // api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'SELL', 0.2, utils.format(close + utils.getAtrTicks(latestAtr, 0.01) * 1.5), utils.format(close - utils.getAtrTicks(latestAtr, 0.01) * 2), utils.format(close - (utils.getAtrTicks(latestAtr, 0.01) * 2) - 0.02));
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (moneyFlowDownwardTrend && macdCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', utils.format(close - (utils.getAtrTicks(latestAtr, 0.01) * 1.5)));
        console.log('stop price: ', utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 2)));
        console.log('stop limit price: ', utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 2) + 0.02));
        console.log('atr', utils.getAtrTicks(latestAtr, 0.01));
        // api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'BUY', 0.2, utils.format(close - utils.getAtrTicks(latestAtr, 0.01) * 1.5), utils.format(close + utils.getAtrTicks(latestAtr, 0.01) * 2), utils.format(close + (utils.getAtrTicks(latestAtr, 0.01) * 2) + 0.02));
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = moneyFlowMacdAtrStrategy;
