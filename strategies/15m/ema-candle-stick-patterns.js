const ta = require('technicalindicators');

const utils = require('../utils');
const candleSticks = require('../../api/candleSticks');
const limitOrder = require('../../api/limitOrder');
const ocoOrder = require('../../api/ocoOrder');

let inLongPosition = false;
let inShortPosition = false;

const inputEma200 = {
  period: 200,
  values: []
};

const inputEma50 = {
  period: 50,
  values: []
};

let opens = [];
let closes = [];

candleSticks('BTCUSDT', '15m', 200).then(res => {
  inputEma200.values = res.data.map(d => parseFloat(d[4]));
  inputEma50.values = res.data.map(d => parseFloat(d[4]));

  opens = res.data.map(d => parseFloat(d[1]));
  closes = res.data.map(d => parseFloat(d[4]));
});

const emaCandleStickPatternStrategy = (open, high, low, close) => {
  inputEma200.values.push(close);
  inputEma50.values.push(close);
  opens.push(open);
  closes.push(close);

  if (inputEma200.values.length > inputEma200.period) {
    const ema200 = new ta.EMA.calculate(inputEma200);
    const ema50 = new ta.EMA.calculate(inputEma50);

    const latestEma200 = ema200[ema200.length - 1];
    const latestEma50 = ema50[ema50.length - 1];

    const oldClose = closes[closes.length - 3];
    const previousClose = closes[closes.length - 2];
    const latestClose = closes[closes.length - 1];
    const oldOpen = opens[opens.length - 3];
    const previousOpen = opens[opens.length - 2];
    const latestOpen = opens[opens.length - 1];

    const aboveEma200 = close > latestEma200;
    const belowEma200 = close < latestEma200;
    const touchingEma50 = high >= latestEma50 && close < latestEma50;

    const bullishEngulfing = utils.getBullishEngulfing(oldOpen, oldClose, previousOpen, previousClose, latestOpen, latestClose);
    const bearishEngulfing = utils.getBearishEngulfing(oldOpen, oldClose, previousOpen, previousClose, latestOpen, latestClose);
    const bullishPinBar = utils.getBullishPinBar(open, low, high, close);
    const bearishPinBar = utils.getBearishPinBar(open, low, high, close);

    if (aboveEma200 && touchingEma50 && (bullishEngulfing || bullishPinBar)) {
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

    if (belowEma200 && touchingEma50 && (bearishEngulfing || bearishPinBar)) {
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

module.exports = emaCandleStickPatternStrategy;
