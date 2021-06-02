module.exports.getSwingHigh = (highs) => {
  return Math.max(...highs);
};

module.exports.getSwingLow = (lows) => {
  return Math.min(...lows);
};

module.exports.getAtrTicks = (atr, tickSize) => {
  return atr * tickSize;
};

module.exports.format = (number) => {
  return parseFloat(number.toPrecision(10));
};

module.exports.getHiddenBullishDivergence = (lows, indicator) => {
  const sortedLows = lows.slice(lows.length - 15).sort((a, b) => a - b);
  const lowestIndex = lows.findIndex(l => l === sortedLows[0]);
  const nextLowestIndex = lows.findIndex(l => l === sortedLows[1]);

  return lowestIndex < nextLowestIndex && indicator[lowestIndex] > indicator[nextLowestIndex];
};

module.exports.getHiddenBearishDivergence = (highs, indicator) => {
  const sortedHighs = highs.slice(highs.length - 15).sort((a, b) => b - a);
  const highestIndex = highs.findIndex(h => h === sortedHighs[0]);
  const nextHighestIndex = highs.findIndex(h => h === sortedHighs[1]);

  return highestIndex < nextHighestIndex && indicator[highestIndex] > indicator[nextHighestIndex];
};


