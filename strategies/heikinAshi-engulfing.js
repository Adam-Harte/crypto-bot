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

const inputAtr = {
  high: [],
  low: [],
  close: [],
  period: 14
};

const heikinAshiResults = [];
let heikinAshiCandle;

// api.getCandleSticks('BTCUSDT', '15m', 20).then(res => {
//   inputHeikinAshi.open = res.data.map(d => parseFloat(d[1]));
//   inputHeikinAshi.high = res.data.map(d => parseFloat(d[2]));
//   inputHeikinAshi.low = res.data.map(d => parseFloat(d[3]));
//   inputHeikinAshi.close = res.data.map(d => parseFloat(d[4]));
//   inputHeikinAshi.volume = res.data.map(d => d[6]);

//   inputAtr.high = res.data.map(d => parseFloat(d[2]));
//   inputAtr.low = res.data.map(d => parseFloat(d[3]));
//   inputAtr.close = res.data.map(d => parseFloat(d[4]));

//   heikinAshiCandle = new ta.HeikinAshi(inputHeikinAshi);
// });

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

    const buySignal = previousHeikinAshi.open > previousHeikinAshi.close && latestHeikinAshi.close > latestHeikinAshi.open && latestHeikinAshi.close - latestHeikinAshi.open > previousHeikinAshi.open - previousHeikinAshi.close;
    const sellSignal = previousHeikinAshi.close > previousHeikinAshi.open && latestHeikinAshi.open > latestHeikinAshi.close && latestHeikinAshi.open - latestHeikinAshi.close > previousHeikinAshi.close - previousHeikinAshi.open;

    if (buySignal) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', close + ((latestAtr * 0.01) * 1.5));
        console.log('stop price: ', close - ((latestAtr * 0.01) * 2));
        console.log('stop limit price: ', close - ((latestAtr * 0.01) * 2) - 0.02);
        console.log('atr', latestAtr * 0.01);
        // api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'SELL', 0.2, close + ((close - lowestLow) * 2), lowestLow - 0.02, lowestLow - 0.03);
        inLongPosition = true;
        inShortPosition = false;
      }

      if (inLongPosition) {
        console.log('close: ', close);
        console.log('low: ', low);
        console.log('high: ', high);
      }
    }

    if (sellSignal) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', close - ((latestAtr * 0.01) * 1.5));
        console.log('stop price: ', close + ((latestAtr * 0.01) * 2));
        console.log('stop limit price: ', close + ((latestAtr * 0.01) * 2) + 0.02);
        console.log('atr', latestAtr * 0.01);
        // api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'BUY', 0.2, close - ((highestHigh - close) * 2), highestHigh + 0.02, highestHigh + 0.03);
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
};

module.exports = heikinAshiEngulfingStrategy;
