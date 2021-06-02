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

const ichimokuInput = {
  high: [],
  low: [],
  conversionPeriod: 9,
  basePeriod: 26,
  spanPeriod: 52,
  displacement: 26
};

const heikinAshiResults = [];
const heikinAshiCandle = new ta.HeikinAshi(inputHeikinAshi);

const heikinAshiIchimokuStrategy = (open, high, low, close) => {
  heikinAshiResults.push(heikinAshiCandle.nextValue({
    open: open,
    high: high,
    low: low,
    close: close
  }));
  ichimokuInput.high.push(high);
  ichimokuInput.low.push(low);

  if (heikinAshiResults.length > 52) {
    const ichimoku = new ta.IchimokuCloud.calculate(ichimokuInput);

    const oldHeikinAshi = heikinAshiResults[heikinAshiResults.length - 3];
    const previousHeikinAshi = heikinAshiResults[heikinAshiResults.length - 2];
    const latestHeikinAshi = heikinAshiResults[heikinAshiResults.length - 1];
    const latestIchimoku = ichimoku[ichimoku.length - 1];

    const oldCandleRed = oldHeikinAshi.close < oldHeikinAshi.open;
    const previousCandleRed = previousHeikinAshi.close < previousHeikinAshi.open;
    const previousCandleStrongRed = previousHeikinAshi.close < previousHeikinAshi.open && previousHeikinAshi.open >= previousHeikinAshi.high;
    const latestCandleStrongRed = latestHeikinAshi.close < latestHeikinAshi.open && latestHeikinAshi.open >= latestHeikinAshi.high;

    const oldCandleGreen = oldHeikinAshi.close > oldHeikinAshi.open;
    const previousCandleGreen = previousHeikinAshi.close > previousHeikinAshi.open;
    const previousCandleStrongGreen = previousHeikinAshi.close > previousHeikinAshi.open && previousHeikinAshi.open >= previousHeikinAshi.low;
    const latestCandleStrongGreen = latestHeikinAshi.close > latestHeikinAshi.open && latestHeikinAshi.open >= latestHeikinAshi.low;

    const bullishIndicator = (oldCandleRed && previousCandleStrongGreen && latestCandleStrongGreen) || (oldCandleRed && previousCandleGreen && latestCandleStrongGreen);
    const bearishIndicator = (oldCandleGreen && previousCandleRed && latestCandleStrongRed) || (oldCandleGreen && previousCandleStrongRed)
    const buySignal = bullishIndicator && latestIchimoku.spanA > latestIchimoku.spanB && close > latestIchimoku.spanA;
    const sellSignal = bearishIndicator && latestIchimoku.spanA < latestIchimoku.spanB && close < latestIchimoku.spanA;

    if (buySignal) {
      if (!inLongPosition) {
        console.log('Long');
        console.log('limit price: ', close * 1.02);
        console.log('stop price: ', close * 0.99);
        console.log('stop limit price: ', close * 0.98);
        // buy binance order logic here
        // api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'SELL', 0.2, close * 1.02, close * 0.99, close * 0.98);
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (sellSignal) {
      if (!inShortPosition) {
        console.log('Short');
        console.log('limit price: ', close * 0.98);
        console.log('stop price: ', close * 1.01);
        console.log('stop limit price: ', close * 1.02);
        // sell binance order logic here
        // api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'BUY', 0.2, close * 0.98, close * 1.01, close * 1.02);
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
};

module.exports = heikinAshiIchimokuStrategy;
