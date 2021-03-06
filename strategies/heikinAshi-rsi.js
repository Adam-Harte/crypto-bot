const ta = require('technicalindicators');

const utils = require('./utils');
const candleSticks = require('../api/candleSticks');
const limitOrder = require('../api/limitOrder');
const ocoOrder = require('../api/ocoOrder');

let inLongPosition = false;
let inShortPosition = false;

const inputHeikinAshi = {
  open: [],
  high: [],
  low: [],
  close: [],
  timestamp: [],
  volume: []
};

const inputRSI = {
  values: [],
  period: 14
};

const inputAtr = {
  high: [],
  low: [],
  close: [],
  period: 14
};

const heikinAshiResults = [];
let heikinAshiCandle;

candleSticks('BTCUSDT', '15m', 20).then(res => {
  inputHeikinAshi.open = res.data.map(d => parseFloat(d[1]));
  inputHeikinAshi.high = res.data.map(d => parseFloat(d[2]));
  inputHeikinAshi.low = res.data.map(d => parseFloat(d[3]));
  inputHeikinAshi.close = res.data.map(d => parseFloat(d[4]));
  inputHeikinAshi.volume = res.data.map(d => d[6]);

  inputRSI.values = res.data.map(d => parseFloat(d[4]));

  inputAtr.high = res.data.map(d => parseFloat(d[2]));
  inputAtr.low = res.data.map(d => parseFloat(d[3]));
  inputAtr.close = res.data.map(d => parseFloat(d[4]));
});

const heikinAshiRsiStrategy = (open, high, low, close) => {
  heikinAshiCandle = new ta.HeikinAshi(inputHeikinAshi);
  heikinAshiResults.push(heikinAshiCandle.nextValue({
    open: open,
    high: high,
    low: low,
    close: close
  }));
  inputRSI.values.push(close);
  inputAtr.high.push(high);
  inputAtr.low.push(low);
  inputAtr.close.push(close);

  if (heikinAshiResults.length > inputRSI.period) {
    const rsi = new ta.RSI.calculate(inputRSI);
    const atr = new ta.ATR.calculate(inputAtr);
    const oldHeikinAshi = heikinAshiResults[heikinAshiResults.length - 3];
    const previousHeikinAshi = heikinAshiResults[heikinAshiResults.length - 2];
    const latestHeikinAshi = heikinAshiResults[heikinAshiResults.length - 1];
    const latestRsi = rsi[rsi.length - 1];
    const previousRsi = rsi[rsi.length - 2];
    const latestAtr = atr[atr.length - 1];

    const oldCandleRed = oldHeikinAshi.close < oldHeikinAshi.open;
    const previousCandleRed = previousHeikinAshi.close < previousHeikinAshi.open;
    const previousCandleStrongRed = previousHeikinAshi.close < previousHeikinAshi.open && previousHeikinAshi.open >= previousHeikinAshi.high;
    const latestCandleStrongRed = latestHeikinAshi.close < latestHeikinAshi.open && latestHeikinAshi.open >= latestHeikinAshi.high;
    const oldCandleGreen = oldHeikinAshi.close > oldHeikinAshi.open;
    const previousCandleGreen = previousHeikinAshi.close > previousHeikinAshi.open;
    const previousCandleStrongGreen = previousHeikinAshi.close > previousHeikinAshi.open && previousHeikinAshi.open >= previousHeikinAshi.low;
    const latestCandleStrongGreen = latestHeikinAshi.close > latestHeikinAshi.open && latestHeikinAshi.open >= latestHeikinAshi.low;

    const bullishIndicator = (oldCandleRed && previousCandleStrongGreen && latestCandleStrongGreen) || (oldCandleRed && previousCandleGreen && latestCandleStrongGreen) || (previousCandleGreen && latestCandleStrongGreen);
    const bearishIndicator = (oldCandleGreen && previousCandleStrongRed && latestCandleStrongRed) || (oldCandleGreen && previousCandleRed && latestCandleStrongRed) || (previousCandleRed && latestCandleStrongRed);
    const buySignal = bullishIndicator && previousRsi < 50 && latestRsi > 50;
    const sellSignal = bearishIndicator && previousRsi > 50 && latestRsi < 50;

    if (buySignal) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', utils.format(close + latestAtr * 1.5, 2));
        console.log('stop price: ', utils.format(close - latestAtr * 2, 2));
        console.log('stop limit price: ', utils.format(close - latestAtr * 2 - 0.02, 2));
        console.log('atr', latestAtr);
        limitOrder('BTCUSDT', 'BUY', 0.001, close);
        ocoOrder('BTCUSDT', 'SELL', 0.001, utils.format(close + latestAtr * 1.5, 2), utils.format(close - latestAtr * 2, 2), utils.format(close - latestAtr * 2 - 0.02, 2));
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (sellSignal) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', utils.format(close - latestAtr * 1.5, 2));
        console.log('stop price: ', utils.format(close + latestAtr * 2, 2));
        console.log('stop limit price: ', utils.format(close + latestAtr * 2 + 0.02, 2));
        console.log('atr', latestAtr);
        limitOrder('BTCUSDT', 'SELL', 0.001, close);
        ocoOrder('BTCUSDT', 'BUY', 0.001, utils.format(close - latestAtr * 1.5, 2), utils.format(close + latestAtr * 2, 2), utils.format(close + latestAtr * 2 + 0.02, 2));
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
};

module.exports = heikinAshiRsiStrategy;
