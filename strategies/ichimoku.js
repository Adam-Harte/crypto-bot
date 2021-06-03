const ta = require('technicalindicators');

const utils = require('./utils');
const candleSticks = require('../api/candleSticks');
const limitOrder = require('../api/limitOrder');
const ocoOrder = require('../api/ocoOrder');

let inLongPosition = false;
let inShortPosition = false;

const ichimokuInput = {
  high: [],
  low: [],
  conversionPeriod: 9,
  basePeriod: 26,
  spanPeriod: 52,
  displacement: 26
};

let lows = [];
let highs = [];

candleSticks('BTCUSDT', '1h', 50).then(res => {
  ichimokuInput.high = res.data.map(d => parseFloat(d[2]));
  ichimokuInput.low = res.data.map(d => parseFloat(d[3]));

  lows = res.data.map(d => parseFloat(d[3]));
  highs = res.data.map(d => parseFloat(d[2]));
});

const ichimokuStrategy = (high, low, close) => {
  ichimokuInput.high.push(parseFloat(high));
  ichimokuInput.low.push(parseFloat(low));
  lows.push(low);
  highs.push(high);

  if (ichimokuInput.low.length > ichimokuInput.spanPeriod) {
    const ichimoku = new ta.IchimokuCloud.calculate(ichimokuInput);
    const previousIchimoku = ichimoku[ichimoku.length - 2];
    const latestIchimoku = ichimoku[ichimoku.length - 1];

    const greenCloud = latestIchimoku.spanA > latestIchimoku.spanB;
    const redCloud = latestIchimoku.spanA < latestIchimoku.spanB;
    const closeAboveCloud = close > latestIchimoku.spanA;
    const closeBelowCloud = close < latestIchimoku.spanA;
    const ichimokuCrossUp = previousIchimoku.conversion < previousIchimoku.base && latestIchimoku.conversion > latestIchimoku.base;
    const ichimokuCrossDown = previousIchimoku.conversion > previousIchimoku.base && latestIchimoku.conversion < latestIchimoku.base;

    if (greenCloud && closeAboveCloud && ichimokuCrossUp) {
      if (!inLongPosition) {
        console.log('Long');
        console.log('limit price: ', utils.format(close + ((close - utils.getSwingLow(lows)) * 2)));
        console.log('stop price: ', utils.format(utils.getSwingLow(lows) - 0.02));
        console.log('stop limit price: ', utils.format(utils.getSwingLow(lows) - 0.03));
        // buy binance order logic here
        limitOrder('BTCUSDT', 'BUY', 0.2, close);
        ocoOrder('BTCUSDT', 'SELL', 0.2, utils.format(close + ((close - utils.getSwingLow(lows)) * 2)), utils.format(utils.getSwingLow(lows) - 0.02), utils.format(utils.getSwingLow(lows) - 0.03));
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (redCloud && closeBelowCloud && ichimokuCrossDown) {
      if (inShortPosition) {
        console.log('Short');
        console.log('limit price: ', utils.format(close - ((utils.getSwingHigh(highs) - close) * 2)));
        console.log('stop price: ', utils.format(utils.getSwingHigh(highs) + 0.02));
        console.log('stop limit price: ', utils.format(utils.getSwingHigh(highs) + 0.03));
        // sell binance order logic here
        limitOrder('BTCUSDT', 'SELL', 0.2, close);
        ocoOrder('BTCUSDT', 'BUY', 0.2, utils.format(close - ((utils.getSwingHigh(highs) - close) * 2)), utils.format(utils.getSwingHigh(highs) + 0.02), utils.format(utils.getSwingHigh(highs) + 0.03));
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
};

module.exports = ichimokuStrategy;
