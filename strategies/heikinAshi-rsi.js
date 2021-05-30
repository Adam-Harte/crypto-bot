const ta = require('technicalindicators');

const api = require('../testApi');

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

const heikinAshiResults = [];
const heikinAshiCandle = new ta.HeikinAshi(inputHeikinAshi);

api.getCandleSticks('BTCUSDT', '15m', 20).then(res => {
  inputHeikinAshi.open = res.data.map(d => parseFloat(d[1]));
  inputHeikinAshi.high = res.data.map(d => parseFloat(d[2]));
  inputHeikinAshi.low = res.data.map(d => parseFloat(d[3]));
  inputHeikinAshi.close = res.data.map(d => parseFloat(d[4]));
  inputHeikinAshi.volume = res.data.map(d => d[6]);

  inputRSI.values = res.data.map(d => parseFloat(d[4])),

  heikinAshiCandle = new ta.HeikinAshi(inputHeikinAshi);
});

const heikinAshiRsiStrategy = (open, high, low, close) => {
  heikinAshiResults.push(heikinAshiCandle.nextValue({
    open: open,
    high: high,
    low: low,
    close: close
  }));
  inputRSI.values.push(close);

  if (heikinAshiResults.length > inputRSI.period) {
    const rsi = ta.RSI.calculate(inputRSI);
    const oldHeikinAshi = heikinAshiResults[heikinAshiResults.length - 3];
    const previousHeikinAshi = heikinAshiResults[heikinAshiResults.length - 2];
    const latestHeikinAshi = heikinAshiResults[heikinAshiResults.length - 1];
    const latestRsi = rsi[rsi.length - 1];
    const previousRsi = rsi[rsi.length - 2];

    const oldCandleRed = oldHeikinAshi.close < oldHeikinAshi.open;
    const previousCandleRed = previousHeikinAshi.close < previousHeikinAshi.open;
    const previousCandleStrongRed = previousHeikinAshi.close < previousHeikinAshi.open && (parseFloat(((previousHeikinAshi.open - previousHeikinAshi.close) / previousHeikinAshi.open) * 100).toFixed(3) > 0.006) && previousHeikinAshi.open >= previousHeikinAshi.high;
    const latestCandleStrongRed = latestHeikinAshi.close < latestHeikinAshi.open && (parseFloat(((latestHeikinAshi.open - latestHeikinAshi.close) / latestHeikinAshi.open) * 100).toFixed(3) > 0.006) && latestHeikinAshi.open >= latestHeikinAshi.high;
    const oldCandleGreen = oldHeikinAshi.close > oldHeikinAshi.open;
    const previousCandleGreen = previousHeikinAshi.close > previousHeikinAshi.open;
    const previousCandleStrongGreen = previousHeikinAshi.close > previousHeikinAshi.open && (parseFloat(((previousHeikinAshi.close - previousHeikinAshi.open) / previousHeikinAshi.close) * 100).toFixed(3) > 0.006) && previousHeikinAshi.open >= previousHeikinAshi.low;
    const latestCandleStrongGreen = latestHeikinAshi.close > latestHeikinAshi.open && (parseFloat(((latestHeikinAshi.close - latestHeikinAshi.open) / latestHeikinAshi.close) * 100).toFixed(3) > 0.006) && latestHeikinAshi.open >= latestHeikinAshi.low;

    const bullishIndicator = (oldCandleRed && previousCandleStrongGreen && latestCandleStrongGreen) || (oldCandleRed && previousCandleGreen && latestCandleStrongGreen);
    const bearishIndicator = (oldCandleGreen && previousCandleRed && latestCandleStrongRed) || (oldCandleGreen && previousCandleStrongRed) || (previousCandleGreen && latestCandleStrongRed);
    const buySignal = bullishIndicator && previousRsi < 50 && latestRsi > 50;
    const sellSignal = bearishIndicator && previousRsi > 50 && latestRsi < 50;

    if (buySignal) {
      if (!inLongPosition) {
        // buy binance order logic here
        api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        api.ocoOrder('BTCUSDT', 'SELL', 0.2, close * 1.2, close * 0.99, close * 0.98);
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (sellSignal) {
      if (!inShortPosition) {
        // sell binance order logic here
        api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        api.ocoOrder('BTCUSDT', 'BUY', 0.2, close * 0.98, close * 1.01, close * 1.02);
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
};

module.exports = heikinAshiRsiStrategy;
