const ta = require('technicalindicators');

const PERIOD = 14;
const RSI_OVERSOLD = 30;
const RSI_OVERBOUGHT = 70;

const inputRSI = {
  values: [],
  period: PERIOD
};
let inPositionRSI = false;

const calculateRSI = (close) => {
  inputRSI.values.push(parseFloat(close));

    if (inputRSI.values.length > PERIOD) {
      const rsi = ta.RSI.calculate(inputRSI);
      const latestRsi = rsi[rsi.length - 1];

      console.log(`The current RSI is ${latestRsi}`);

      if (latestRsi > RSI_OVERBOUGHT) {
        if (inPositionRSI) {
          console.log(`Sell! Sell! Sell! at ${close}`);
          // sell binance order logic here
          inPositionRSI = false;
        }
      }

      if (latestRsi < RSI_OVERSOLD) {
        if (!inPositionRSIRSI) {
          console.log(`Buy! Buy! Buy! at ${close}`);
          // buy binance order logic here
          inPositionRSI = true;
        }
      }
    }
};

module.exports = calculateRSI;
