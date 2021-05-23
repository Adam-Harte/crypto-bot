const ta = require('technicalindicators');

const calculateBollingerBands = (input, period, close, inPosition) => {
  input.values.push(parseFloat(close));

    if (input.values.length > period) {
      const bollingerBands = ta.BollingerBands(input);
      const latestBollinger = bollingerBands[bollingerBands.length - 1];

      if (latestBollinger.lower > close) {
        console.log('broke through bollinger lower!');
        if (!inPosition) {
          console.log(`buy at ${close}`);
          // buy binance order logic here
          inPosition = true;
        }
      }

      if (latestBollinger.upper < close) {
        console.log('broke through bollinger upper!');
        if (inPosition) {
          console.log(`sell at ${close}`);
          // sell binance order logic
          inPosition = false;
        }
      }
    }
};

module.exports = calculateBollingerBands;
