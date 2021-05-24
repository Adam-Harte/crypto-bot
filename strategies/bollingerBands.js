const ta = require('technicalindicators');

let inPositionBollinger = false;

const inputBollingerBands = {
  period: 14,
  values: [],
  stdDev: 2
};

const calculateBollingerBands = (close) => {
  inputBollingerBands.values.push(parseFloat(close));

    if (inputBollingerBands.values.length > inputBollingerBands.period) {
      const bollingerBands = ta.BollingerBands.calculate(inputBollingerBands);
      const latestBollinger = bollingerBands[bollingerBands.length - 1];

      if (latestBollinger.lower > close) {
        console.log('broke through bollinger lower!');
        if (!inPositionBollinger) {
          console.log(`buy at ${close}`);
          // buy binance order logic here
          inPositionBollinger = true;
        }
      }

      if (latestBollinger.upper < close) {
        console.log('broke through bollinger upper!');
        if (inPositionBollinger) {
          console.log(`sell at ${close}`);
          // sell binance order logic
          inPositionBollinger = false;
        }
      }
    }
};

module.exports = calculateBollingerBands;
