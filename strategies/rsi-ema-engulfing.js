const ta = require('technicalindicators');

const utils = require('./utils');
const candleSticks = require('../api/candleSticks');
const limitOrder = require('../api/limitOrder');
const ocoOrder = require('../api/ocoOrder');

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

let opens = [];
let closes = [];

candleSticks('BTCUSDT', '1h', 200).then(res => {
  inputEma200.values = res.data.map(d => parseFloat(d[4]));
  inputRsi.values = res.data.map(d => parseFloat(d[4]));

  closes = res.data.map(d => parseFloat(d[4]));
  opens = res.data.map(d => parseFloat(d[1]));
});

const rsiEmaEngulfingStrategy = (open, high, low, close) => {
  inputEma200.values.push(close);
  inputRsi.values.push(close);
  closes.push(close);
  opens.push(open);

  if (inputRsi.values.length > inputRsi.period) {
    const ema200 = new ta.EMA.calculate(inputEma200);
    const rsi = new ta.RSI.calculate(inputRsi);

    const latestEma200 = ema200[ema200.length - 1];
    const latestRsi = rsi[rsi.length - 1];
    const previousClose = closes[closes.length - 2];
    const latestClose = closes[closes.length - 1];
    const previousOpen = opens[opens.length - 2];
    const latestOpen = opens[opens.length - 1];

    const rsiAbove = latestRsi > 50;
    const rsiBelow = latestRsi < 50;
    const aboveEma = close > latestEma200;
    const belowEma = close < latestEma200;
    const greenEngulfing = utils.getBullishEngulfing(previousOpen, previousClose, latestOpen, latestClose);
    const redEngulfing = utils.getBearishEngulfing(previousOpen, previousClose, latestOpen, latestClose);

    if (aboveEma && rsiAbove && greenEngulfing) {
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

    if (belowEma && rsiBelow && redEngulfing) {
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

module.exports = rsiEmaEngulfingStrategy;
