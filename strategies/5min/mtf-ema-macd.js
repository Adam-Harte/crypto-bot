const ta = require('technicalindicators');

const utils = require('../utils');
const candleSticks = require('../../api/candleSticks');
const limitOrder = require('../../api/limitOrder');
const ocoOrder = require('../../api/ocoOrder');

let inLongPosition = false;
let inShortPosition = false;

let min15Count = 3;
let hour1Count = 12;

const inputEma1h50 = {
  period: 50,
  values: []
};

const inputEma15m50 = {
  period: 50,
  values: []
};

const inputMacd = {
  values: [],
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
};

let highs = [];
let lows = [];

candleSticks('BTCUSDT', '1h', 50).then(res => {
  inputEma1h50.values = res.data.map(d => parseFloat(d[4]));
});

candleSticks('BTCUSDT', '15m', 50).then(res => {
  inputEma15m50.values = res.data.map(d => parseFloat(d[4]));
});

candleSticks('BTCUSDT', '5m', 50).then(res => {
  inputMacd.values = res.data.map(d => parseFloat(d[4]));

  highs = res.data.map(d => parseFloat(d[2]));
  lows = res.data.map(d => parseFloat(d[3]));
});

const mtfEmaMacdStrategy = (open, high, low, close) => {
  min15Count--;
  hour1Count--;

  if (min15Count === 0) {
    inputEma15m50.values.push(close);
    min15Count = 3;
  }

  if (hour1Count === 0) {
    inputEma1h50.values.push(close);
    hour1Count = 12;
  }

  inputMacd.values.push(close);
  highs.push(high);
  lows.push(low);

  if (inputEma1h50.values.length > inputEma1h50.period) {
    const ema1h50 = new ta.EMA.calculate(inputEma1h50);
    const ema15m50 = new ta.EMA.calculate(inputEma15m50);
    const macd = new ta.MACD.calculate(inputMacd);

    const latestEma1h50 = ema1h50[ema1h50.length - 1];
    const latestEma15m50 = ema15m50[ema15m50.length - 1];
    const previousMacd = macd[macd.length - 2];
    const latestMacd = macd[macd.length - 1];

    const aboveEma1h = latestEma15m50 > latestEma1h50;
    const belowEma1h = latestEma15m50 < latestEma1h50;
    const macdHiddenBullishDivergence = utils.getHiddenBullishDivergence(lows, macd.map(m => m.MACD)) && utils.getHiddenBullishDivergence(lows, macd.map(m => m.signal));
    const macdHiddenBearishDivergence = utils.getHiddenBearishDivergence(highs, macd.map(m => m.MACD)) && utils.getHiddenBearishhDivergence(highs, macd.map(m => m.signal));
    const macdCrossUp = previousMacd.MACD < previousMacd.signal && latestMacd.MACD > latestMacd.signal && latestMacd.histogram < 1;
    const macdCrossDown = previousMacd.MACD > previousMacd.signal && latestMacd.MACD < latestMacd.signal && latestMacd.histogram > 1;

    if (aboveEma1h && macdHiddenBullishDivergence && macdCrossUp) {
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

    if (belowEma1h && macdHiddenBearishDivergence && macdCrossDown) {
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

module.exports = mtfEmaMacdStrategy;
