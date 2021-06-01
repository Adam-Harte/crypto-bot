const ta = require('technicalindicators');

const api = require('../testApi');

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

let lows = [];
let highs = [];

// api.getCandleSticks('BTCUSDT', '1h', 50).then(res => {
//   inputEma200.values = res.data.map(d => parseFloat(d[4]));

//   inputStochastic.high = res.data.map(d => parseFloat(d[2]));
//   inputStochastic.low = res.data.map(d => parseFloat(d[3]));
//   inputStochastic.close = res.data.map(d => parseFloat(d[4]));

//   inputMoneyFlow.high = res.data.map(d => parseFloat(d[2]));
//   inputMoneyFlow.low = res.data.map(d => parseFloat(d[3]));
//   inputMoneyFlow.close = res.data.map(d => parseFloat(d[4]));
//   inputMoneyFlow.volume = res.data.map(d => parseFloat(d[5]));

//   lows = res.data.map(d => parseFloat(d[3]));
//   highs = res.data.map(d => parseFloat(d[2]));
// });

const moneyFlowStochasticEmaStrategy = (high, low, close, volume) => {
  inputMoneyFlow.high.push(high);
  inputMoneyFlow.low.push(low);
  inputMoneyFlow.close.push(close);
  inputMoneyFlow.volume.push(volume);
  inputEma200.values.push(close);
  inputStochastic.high.push(high);
  inputStochastic.low.push(low);
  inputStochastic.close.push(close);
  inputRsi.values.push(close);
  lows.push(low);
  highs.push(high);

  if (inputRsi.values.length > inputRsi.period) {
    const ema200 = new ta.EMA.calculate(inputEma200);
    const stochastic = new ta.Stochastic.calculate(inputStochastic);
    const moneyFlow = new ta.MFI.calculate(inputRsi);

    const latestEma200 = ema200[ema200.length - 1];
    const previousStochastic = stochastic[stochastic.length - 2];
    const latestStochastic = stochastic[stochastic.length - 1];

    const sortedLows = lows.slice(lows.length - 15).sort((a, b) => a - b);
    const lowestIndex = lows.findIndex(l => l === sortedLows[0]);
    const nextLowestIndex = lows.findIndex(l => l === sortedLows[1]);

    const sortedHighs = highs.slice(highs.length - 15).sort((a, b) => b - a);
    const highestIndex = highs.findIndex(h => h === sortedHighs[0]);
    const nextHighestIndex = highs.findIndex(h => h === sortedHighs[1]);

    const hiddenBullishDivergence = lowestIndex < nextLowestIndex && moneyFlow[lowestIndex] > moneyFlow[nextLowestIndex];
    const hiddenBearishDivergence = highestIndex < nextHighestIndex && moneyFlow[highestIndex] > moneyFlow[nextHighestIndex];

    const stochasticCrossUp = previousStochastic.k < previousStochastic.d && latestStochastic.k > latestStochastic.d;
    const stochasticCrossDown = previousStochastic.k > previousStochastic.d && latestStochastic.k < latestStochastic.d;
    const aboveEma = close > latestEma200;
    const belowEma = close < latestEma200;

    if (aboveEma && hiddenBullishDivergence && stochasticCrossUp) {
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

    if (belowEma && hiddenBearishDivergence && stochasticCrossDown) {
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

module.exports = moneyFlowStochasticEmaStrategy;
