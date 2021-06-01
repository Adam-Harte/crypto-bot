const ta = require('technicalindicators');

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

// api.getCandleSticks('BTCUSDT', '1h', 50).then(res => {
//   ichimokuInput.high = res.data.map(d => parseFloat(d[2]));
//   ichimokuInput.low = res.data.map(d => parseFloat(d[3]));

//   lows = res.data.map(d => parseFloat(d[3]));
//   highs = res.data.map(d => parseFloat(d[2]));
// });

const ichimokuStrategy = (high, low, close) => {
  ichimokuInput.high.push(parseFloat(high));
  ichimokuInput.low.push(parseFloat(low));
  lows.push(low);
  highs.push(high);

  if (ichimokuInput.low.length > ichimokuInput.spanPeriod) {
    const ichimoku = new ta.IchimokuCloud.calculate(ichimokuInput);
    const previousIchimoku = ichimoku[ichimoku.length - 2];
    const latestIchimoku = ichimoku[ichimoku.length - 1];

    const sortedLows = lows.slice(lows.length - 15).sort((a, b) => a - b);
    const sortedHighs = highs.slice(highs.length - 15).sort((a, b) => b - a);

    const greenCloud = latestIchimoku.spanA > latestIchimoku.spanB;
    const redCloud = latestIchimoku.spanA < latestIchimoku.spanB;
    const closeAboveCloud = close > latestIchimoku.spanA;
    const closeBelowCloud = close < latestIchimoku.spanA;
    const ichimokuCrossUp = previousIchimoku.conversion < previousIchimoku.base && latestIchimoku.conversion > latestIchimoku.base;
    const ichimokuCrossDown = previousIchimoku.conversion > previousIchimoku.base && latestIchimoku.conversion < latestIchimoku.base;

    if (greenCloud && closeAboveCloud && ichimokuCrossUp) {
      if (!inLongPosition) {
        console.log('Long');
        console.log('limit price: ', close + ((close - sortedLows[0]) * 2));
        console.log('stop price: ', sortedLows[0] - 0.02);
        console.log('stop limit price: ', sortedLows[0] - 0.03);
        // buy binance order logic here
        // api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'SELL', 0.2, close + ((close - lowestLow) * 2), lowestLow - 0.02, lowestLow - 0.03);
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (redCloud && closeBelowCloud && ichimokuCrossDown) {
      if (inShortPosition) {
        console.log('Short');
        console.log('limit price: ', close - ((sortedHighs[0] - close) * 2));
        console.log('stop price: ', sortedHighs[0] + 0.02);
        console.log('stop limit price: ', sortedHighs[0] + 0.03);
        // sell binance order logic here
        // api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'BUY', 0.2, close - ((highestHigh - close) * 2), highestHigh + 0.02, highestHigh + 0.03);
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
};

module.exports = ichimokuStrategy;
