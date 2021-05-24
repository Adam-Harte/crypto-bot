const ta = require('technicalindicators');

const inputMACD = {
  values: [],
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
}

let inPositionMacd = false;

const calculateMacd = (close, period) => {
  inputMACD.values.push(parseFloat(close));

    if (inputMACD.values.length > period) {
      const macd = ta.MACD.calculate(inputMACD);
      const oldMacd = macd[macd.length - 3];
      const previousMacd = macd[macd.length - 2];
      const latestMacd = macd[macd.length - 1];

      if (oldMacd.histogram < 1 && previousMacd.histogram > 1 && latestMacd.histogram > 1.5) {
        console.log('MACD upward trend of MACD line above period line');

        if (!inPositionMacd) {
          console.log(`buy at ${close}`);
          // buy binance order logic here
          inPositionMacd = true;
        }
      }

      if (oldMacd.histogram < 2 && previousMacd.histogram < 1.5 && latestMacd.histogram <= 1) {
        console.log('MACD downward trend of period line close to going above macd line');

        if (inPositionMacd) {
          console.log(`sell at ${close}`);
          // sell binance order logic here
          inPositionMacd = false;
        }
      }
    }
};

module.exports = calculateMacd;
