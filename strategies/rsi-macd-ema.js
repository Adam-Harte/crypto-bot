const ta = require('technicalindicators');

const utils = require('./utils');
const api = require('../testApi');

let inLongPosition = false;
let inShortPosition = false;

const inputEma200 = {
  period: 200,
  values: []
};

const inputRsi = {
  values: [],
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

let lows = [];
let highs = [];

// api.getCandleSticks('BTCUSDT', '1h', 50).then(res => {
//   inputEma200.values = res.data.map(d => parseFloat(d[4]));

//   inputMacd.values = res.data.map(d => parseFloat(d[4]));

//   inputRsi.values = res.data.map(d => parseFloat(d[4]));

//   lows = res.data.map(d => parseFloat(d[3]));
//   highs = res.data.map(d => parseFloat(d[2]));
// });

const rsiMacdEmaStrategy = (high, low, close) => {
  inputEma200.values.push(close);
  inputMacd.values.push(close);
  inputRsi.values.push(close);
  lows.push(low);
  highs.push(high);

  if (inputMacd.values.length > inputMacd.slowPeriod) {
    const ema200 = new ta.EMA.calculate(inputEma200);
    const macd = new ta.MACD.calculate(inputMacd);
    const rsi = new ta.RSI.calculate(inputRsi);

    const latestEma200 = ema200[ema200.length - 1];
    const previousMacd = macd[macd.length - 2];
    const latestMacd = macd[macd.length - 1];

    const macdCrossUp = previousMacd.MACD < previousMacd.signal && latestMacd.MACD > latestMacd.signal;
    const macdCrossDown = previousMacd.MACD > previousMacd.signal && latestMacd.MACD < latestMacd.signal;
    const aboveEma = close > latestEma200;
    const belowEma = close < latestEma200;

    if (aboveEma && utils.getHiddenBullishDivergence(lows, rsi) && macdCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', utils.format(close + ((close - utils.getSwingLow(lows)) * 2)));
        console.log('stop price: ', utils.format(utils.getSwingLow(lows) - 0.02));
        console.log('stop limit price: ', utils.format(utils.getSwingLow(lows) - 0.03));
        // api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'SELL', 0.2, utils.format(close + ((close - utils.getSwingLow(lows)) * 2)), utils.format(utils.getSwingLow(lows) - 0.02), utils.format(utils.getSwingLow(lows) - 0.03));
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (belowEma && utils.getHiddenBearishDivergence(highs, rsi) && macdCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', utils.format(close - ((utils.getSwingHigh(highs) - close) * 2)));
        console.log('stop price: ', utils.format(utils.getSwingHigh(highs) + 0.02));
        console.log('stop limit price: ', utils.format(utils.getSwingHigh(highs) + 0.03));
        // api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'BUY', 0.2, utils.format(close - ((utils.getSwingHigh(highs) - close) * 2)), utils.format(utils.getSwingHigh(highs) + 0.02), utils.format(utils.getSwingHigh(highs) + 0.03));
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = rsiMacdEmaStrategy;
