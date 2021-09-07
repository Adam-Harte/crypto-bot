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

const inputAtr = {
  high: [],
  low: [],
  close: [],
  period: 14
};

const heikinAshiResults = [];
let heikinAshiCandle;

candleSticks('BTCUSDT', '1m', 20).then(res => {
  inputHeikinAshi.open = res.data.map(d => parseFloat(d[1]));
  inputHeikinAshi.high = res.data.map(d => parseFloat(d[2]));
  inputHeikinAshi.low = res.data.map(d => parseFloat(d[3]));
  inputHeikinAshi.close = res.data.map(d => parseFloat(d[4]));
  inputHeikinAshi.volume = res.data.map(d => d[6]);

  inputAtr.high = res.data.map(d => parseFloat(d[2]));
  inputAtr.low = res.data.map(d => parseFloat(d[3]));
  inputAtr.close = res.data.map(d => parseFloat(d[4]));
});

const heikinAshiEngulfingStrategy = (open, high, low, close) => {
  heikinAshiCandle = new ta.HeikinAshi(inputHeikinAshi);
  heikinAshiResults.push(heikinAshiCandle.nextValue({
    open: open,
    high: high,
    low: low,
    close: close
  }));
  inputAtr.high.push(high);
  inputAtr.low.push(low);
  inputAtr.close.push(close);

  if (heikinAshiResults.length > inputAtr.period) {
    const atr = new ta.ATR.calculate(inputAtr);
    const previousHeikinAshi = heikinAshiResults[heikinAshiResults.length - 2];
    const latestHeikinAshi = heikinAshiResults[heikinAshiResults.length - 1];
    const latestAtr = atr[atr.length - 1];

    const buySignal = utils.getBullishEngulfing(previousHeikinAshi.open, previousHeikinAshi.close, latestHeikinAshi.open, latestHeikinAshi.close);
    const sellSignal = utils.getBearishEngulfing(previousHeikinAshi.open, previousHeikinAshi.close, latestHeikinAshi.open, latestHeikinAshi.close);

    if (buySignal) {
      if (!inLongPosition) {
        // buy binance order logic here
        const limitPrice = utils.format(close + latestAtr * 1.5, 2);
        const stopPrice = utils.format(close - latestAtr * 2, 2);
        const stopLimitPrice = utils.format(close - latestAtr * 2 - 0.02, 2);
        console.log('Long');
        console.log('limit price: ', limitPrice);
        console.log('stop price: ', stopPrice);
        console.log('stop limit price: ', stopLimitPrice);
        console.log('atr', latestAtr);
        if (limitPrice - close > close * 0.001) {
          limitOrder('BTCUSDT', 'BUY', 0.001, close);
          ocoOrder('BTCUSDT', 'SELL', 0.001, limitPrice, stopPrice, stopLimitPrice);
          inLongPosition = true;
          inShortPosition = false;
        }
      }
    }

    if (sellSignal) {
      if (!inShortPosition) {
        // sell binance order logic here
        const limitPrice = utils.format(close - latestAtr * 1.5, 2);
        const stopPrice = utils.format(close + latestAtr * 2, 2);
        const stopLimitPrice = utils.format(close + latestAtr * 2 + 0.02, 2);
        console.log('Short');
        console.log('limit price: ', limitPrice);
        console.log('stop price: ', stopPrice);
        console.log('stop limit price: ', stopLimitPrice);
        console.log('atr', latestAtr);
        if (close - limitPrice > close * 0.001) {
          limitOrder('BTCUSDT', 'SELL', 0.001, close);
          ocoOrder('BTCUSDT', 'BUY', 0.001, limitPrice, stopPrice, stopLimitPrice);
          inShortPosition = true;
          inLongPosition = false;
        }
      }
    }
  }
};

module.exports = heikinAshiEngulfingStrategy;
