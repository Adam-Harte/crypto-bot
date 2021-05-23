const ta = require('technicalindicators');

const calculateRSI = (close, input, period, inPosition, overbought, oversold) => {
  input.values.push(parseFloat(close));

    if (input.values.length > period) {
      const rsi = ta.RSI.calculate(input);
      const latestRsi = rsi[rsi.length - 1];

      console.log(`The current RSI is ${latestRsi}`);

      if (latestRsi > overbought) {
        if (inPosition) {
          console.log(`Sell! Sell! Sell! at ${close}`);
          // sell binance order logic here
          inPosition = false;
        }
      }

      if (latestRsi < oversold) {
        if (!inPositionRSI) {
          console.log(`Buy! Buy! Buy! at ${close}`);
          // buy binance order logic here
          inPosition = true;
        }
      }
    }
};

module.exports = calculateRSI;
