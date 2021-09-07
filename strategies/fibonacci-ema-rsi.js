const ta = require('technicalindicators');
const { getFibRetracement } = require('fib-retracement');

const utils = require('./utils');
const candleSticks = require('../api/candleSticks');
const limitOrder = require('../api/limitOrder');
const ocoOrder = require('../api/ocoOrder');

const inputEma = {
  period: 50,
  values: []
};

const inputRSI = {
  values: [],
  period: 14
};

let opens = [];
let highs = [];
let lows = [];
let closes = [];

candleSticks('BTCUSDT', '1h', 200).then(res => {
  inputEma.values = res.data.map(d => parseFloat(d[4]));
  inputRsi.values = res.data.map(d => parseFloat(d[4]));

  opens = res.data.map(d => parseFloat(d[1]));
  highs = res.data.map(d => parseFloat(d[2]));
  lows = res.data.map(d => parseFloat(d[3]));
  closes = res.data.map(d => parseFloat(d[4]));
});

const fibonacciEmaRsiStrategy = (open, high, low, close) => {
  inputEma.values.push(close);
  inputRsi.values.push(close);
  opens.push(open);
  highs.push(high);
  lows.push(low);
  closes.push(close);

  if (inputRsi.values.length > inputRsi.period) {
    const ema = new ta.EMA.calculate(inputEma200);
    const rsi = new ta.RSI.calculate(inputRsi);
    const fib = getFibRetracement({ levels: { 0: Math.max(...highs.slice(highs.length - 14)), 1: Math.min(...lows.slice(lows.length - 14)) } });

    const latestEma = ema[ema.length - 1];
    const previousClose = closes[closes.length - 2];
    const latestClose = closes[closes.length - 1];
    const previousOpen = opens[opens.length - 2];
    const latestOpen = opens[opens.length - 1];

    const bullishDivergence = utils.getHiddenBullishDivergence(lows, rsi);
    const BearishDivergence = utils.getHiddenBearishDivergence(highs, rsi);
    const aboveEma = close > latestEma;
    const belowEma = close < latestEma;
    const aboveFib = close > fib['0.5'];
    const belowFib = close < fib['0.5'];
    const greenEngulfing = utils.getBullishEngulfing(previousOpen, previousClose, latestOpen, latestClose);
    const redEngulfing = utils.getBearishEngulfing(previousOpen, previousClose, latestOpen, latestClose);

    if (belowEma && bullishDivergence && belowFib && greenEngulfing) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', utils.format(close + ((close - low) * 2), 2));
        console.log('stop price: ', utils.format(low - 10, 2));
        console.log('stop limit price: ', utils.format(low - 10 - 0.02, 2));
        limitOrder('BTCUSDT', 'BUY', 0.001, close);
        ocoOrder('BTCUSDT', 'SELL', 0.001, utils.format(close + ((close - low) * 2), 2), utils.format(low - 10, 2), utils.format(low - 10 - 0.02, 2));
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (aboveEma && BearishDivergence && aboveFib && redEngulfing) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', utils.format(close - ((high - close) * 2), 2));
        console.log('stop price: ', utils.format(high + 10, 2));
        console.log('stop limit price: ', utils.format(high + 10 + 0.02, 2));
        limitOrder('BTCUSDT', 'SELL', 0.001, close);
        ocoOrder('BTCUSDT', 'BUY', 0.001, utils.format(close - ((high - close) * 2), 2), utils.format(high + 10, 2), utils.format(high + 10 + 0.02, 2));
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = fibonacciEmaRsiStrategy;
