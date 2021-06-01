const ta = require('technicalindicators');

const api = require('../testApi');

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

// api.getCandleSticks('BTCUSDT', '1h', 200).then(res => {
//   inputEma200.values = res.data.map(d => parseFloat(d[4]));
//   inputRsi.values = res.data.map(d => parseFloat(d[4]));

//   closes = res.data.map(d => parseFloat(d[4]));
//   opens = res.data.map(d => parseFloat(d[1]));
// });

const rsiStochasticEmaStrategy = (open, close) => {
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
    const greenEngulfing = previousOpen > previousClose && latestClose > latestOpen && latestClose - latestOpen > previousOpen - previousClose;
    const redEngulfing = previousClose > previousOpen && latestOpen > latestClose && latestOpen - latestClose > previousClose - previousOpen;

    if (aboveEma && rsiAbove && greenEngulfing) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', close + ((close - low) * 2));
        console.log('stop price: ', low - 0.02);
        console.log('stop limit price: ', low - 0.03);
        // api.limitOrder('BTCUSDT', 'BUY', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'SELL', 0.2, close + ((close - lowestLow) * 2), lowestLow - 0.02, lowestLow - 0.03);
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (belowEma && rsiBelow && redEngulfing) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', close - ((high - close) * 2));
        console.log('stop price: ', high + 0.02);
        console.log('stop limit price: ', high + 0.03);
        // api.limitOrder('BTCUSDT', 'SELL', 0.2, close);
        // api.ocoOrder('BTCUSDT', 'BUY', 0.2, close - ((highestHigh - close) * 2), highestHigh + 0.02, highestHigh + 0.03);
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = rsiStochasticEmaStrategy;
