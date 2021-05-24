const ta = require('technicalindicators');

const atrInput = {
  high: [],
  low: [],
  close: [],
  period: 14
};

const calculateAtr = (high, low, close) => {
  atrInput.high.push(parseFloat(high));
  atrInput.low.push(parseFloat(low));
  atrInput.close.push(parseFloat(close));

  if (atrInput.close.length > atrInput.period) {
    const atr = ta.ATR.calculate(atrInput);
    const latestAtr = atr[atr.length - 1];

    if (latestAtr < 40) {
      console.log('atr detects low volatility!');
    }

    if (latestAtr > 40 && latestAtr < 60) {
      console.log('atr detects mid volatility!');
    }

    if (latestAtr > 60) {
      console.log('atr detects high volatility!');
    }
  }
};

module.exports = calculateAtr;
