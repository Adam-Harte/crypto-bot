const ta = require('technicalindicators');

const api = require('../testApi');

let inLongPosition = false;
let inShortPosition = false;

const inputRsi = {
  values: [],
  period: 14
};

const inputStochastic = {
  high: [],
  low: [],
  close: [],
  period: 14,
  signalPeriod: 3
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
//   inputStochastic.high = res.data.map(d => parseFloat(d[2]));
//   inputStochastic.low = res.data.map(d => parseFloat(d[3]));
//   inputStochastic.close = res.data.map(d => parseFloat(d[4]));

//   inputMacd.values = res.data.map(d => parseFloat(d[4]));

//   inputRsi.values = res.data.map(d => parseFloat(d[4]));

//   lows = res.data.map(d => parseFloat(d[3]));
//   highs = res.data.map(d => parseFloat(d[2]));
// });

const rsiStochasticMacdStrategy = (high, low, close) => {
  inputStochastic.high.push(high);
  inputStochastic.low.push(low);
  inputStochastic.close.push(close);
  inputMacd.values.push(close);
  inputRsi.values.push(close);
  lows.push(low);
  highs.push(high);

  if (inputMacd.values.length > inputMacd.slowPeriod) {
    const stochastic = new ta.Stochastic.calculate(inputStochastic);
    const macd = new ta.MACD.calculate(inputMacd);
    const rsi = new ta.RSI.calculate(inputRsi);

    const latestStochastic = stochastic[stochastic.length - 1];
    const previousMacd = macd[macd.length - 2];
    const latestMacd = macd[macd.length - 1];
    const latestRsi = rsi[rsi.length - 1];

    const sortedLows = lows.slice(lows.length - 15).sort((a, b) => a - b);
    const sortedHighs = highs.slice(highs.length - 15).sort((a, b) => b - a);

    const stochasticOversold = latestStochastic.k < 30 && latestStochastic.d < 30;
    const stochasticOverbought = latestStochastic.k > 70 && latestStochastic.d > 70
    const macdCrossUp = previousMacd.MACD < previousMacd.signal && latestMacd.MACD > latestMacd.signal;
    const macdCrossDown = previousMacd.MACD > previousMacd.signal && latestMacd.MACD < latestMacd.signal;
    const aboveRsi = latestRsi > 50;
    const belowRsi = latestRsi < 50;

    if (aboveRsi && macdCrossUp && stochasticOversold) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', close + ((close - sortedLows[0]) * 2));
        console.log('stop price: ', sortedLows[0] - 0.02);
        console.log('stop limit price: ', sortedLows[0] - 0.03);
        // api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'SELL', 0.2, close + ((close - lowestLow) * 2), lowestLow - 0.02, lowestLow - 0.03);
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (belowRsi && macdCrossDown && stochasticOverbought) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', close - ((sortedHighs[0] - close) * 2));
        console.log('stop price: ', sortedHighs[0] + 0.02);
        console.log('stop limit price: ', sortedHighs[0] + 0.03);
        // api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'BUY', 0.2, close - ((highestHigh - close) * 2), highestHigh + 0.02, highestHigh + 0.03);
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = rsiStochasticMacdStrategy;
