const ta = require('technicalindicators');

let inPositionIchimoku = false;
const ichimokuInput = {
  high: [],
  low: [],
  conversionPeriod: 9,
  basePeriod: 26,
  spanPeriod: 52,
  displacement: 26
};

const calculateIchimoku = (high, low, close) => {
  ichimokuInput.high.push(parseFloat(high));
  ichimokuInput.low.push(parseFloat(low));

  if (ichimokuInput.low.length > ichimokuInput.spanPeriod) {
    const ichimoku = ta.IchimokuCloud.calculate(ichimokuInput);
    const latestIchimoku = ichimoku[ichimoku.length - 1];

    if (latestIchimoku.spanA > latestIchimoku.spanB) {
      console.log('ichimoku cloud has detected an uptrend!');
      if (close > latestIchimoku.spanA && !inPositionIchimoku) {
        console.log(`buy at ${close}`);
        // buy binance order logic here
        inPositionIchimoku = true;
      }
    }

    if (latestIchimoku.spanA < latestIchimoku.spanB) {
      console.log('ichimoku cloud has detected a downtrend!');
      if (close < latestIchimoku.spanA && inPositionIchimoku) {
        console.log(`sell at ${close}`);
        // sell binance order logic here
        inPositionIchimoku = false;
      }
    }
  }
};

module.exports = calculateIchimoku;
