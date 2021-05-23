const ta = require('technicalindicators');

const calculateMacd = (input, close, period, inPosition) => {
  input.values.push(parseFloat(close));

    if (input.values.length > period) {
      const macd = ta.MACD.calculate(input);
      const oldMacd = macd[macd.length - 3];
      const previousMacd = macd[macd.length - 2];
      const latestMacd = macd[macd.length - 1];

      if (oldMacd.histogram < 1 && previousMacd.histogram > 1 && latestMacd.histogram > 1.5) {
        console.log('MACD upward trend of MACD line above period line');

        if (!inPosition) {
          console.log(`buy at ${close}`);
          // buy binance order logic here
          inPosition = true;
        }
      }

      if (oldMacd.histogram < 2 && previousMacd.histogram < 1.5 && latestMacd.histogram <= 1) {
        console.log('MACD downward trend of period line close to going above macd line');

        if (inPosition) {
          console.log(`sell at ${close}`);
          // sell binance order logic here
          inPosition = false;
        }
      }
    }
};

module.exports = calculateMacd;
