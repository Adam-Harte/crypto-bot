const ta = require('technicalindicators');

let inPositionMovingAverage = false;

const input20ma = {
  period: 20,
  values: []
};

const input50ma = {
  period: 50,
  values: []
};

const calculateMovingAverage = (close) => {
  input20ma.values.push(parseFloat(close));
  input50ma.values.push(parseFloat(close));

  if (input50ma.values.length > input50ma.period) {
    const ma20 = ta.EMA.calculate(input20ma);
    const ma50 = ta.EMA.calculate(input50ma);
    const latest20ma = ma20[ma20.length - 1];
    const latest50ma = ma50[ma50.length - 1];

    if (latest20ma > latest50ma) {
      console.log('The 20 ema line has crossed above the 50 ema line!');
      if (!inPositionMovingAverage) {
        console.log(`buy at ${close}`);
        // buy binance order logic here
        inPositionMovingAverage = true;
      }
    }

    if (latest20ma < latest50ma) {
      console.log('the 20 ema line has crossed below the 50 ema line!');
      if (inPositionMovingAverage) {
        console.log(`sell at ${close}`);
        // sell binance order logic
        inPositionMovingAverage = false;
      }
    }
  }
};

module.exports = calculateMovingAverage;
