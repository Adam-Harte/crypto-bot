const ta = require('technicalindicators');

let inPositionStochastic = false;
const inputStochastic = {
  high: [],
  low: [],
  close: [],
  period: 14,
  signalPeriod: 3
}

const calculateStochastic = (high, low, close) => {
  inputStochastic.high.push(parseFloat(high));
  inputStochastic.low.push(parseFloat(low));
  inputStochastic.close.push(parseFloat(close));

  if (inputStochastic.close.length > inputStochastic.period) {
    const stochastic = ta.Stochastic.calculate(inputStochastic);
    const latestStochastic = stochastic[stochastic.length - 1];

    if (latestStochastic.k < 20 && latestStochastic.d < 20) {
      console.log('stochastic lines indicate oversold!');
      if (!inPositionStochastic) {
        console.log(`buy at ${close}`);
        // buy binance order logic here
        inPositionStochastic = true;
      }
    }

    if (latestStochastic.k > 80 && latestStochastic.d > 80) {
      console.log('stochastic lines indicate overbought!');
      if (inPositionStochastic) {
        console.log(`sell at ${close}`);
        // sell binance order logic here
        inPositionStochastic = false;
      }
    }
  }
};

module.exports = calculateStochastic;
