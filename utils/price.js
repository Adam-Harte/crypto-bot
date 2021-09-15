module.exports.getSwingHigh = (highs) => {
  return Math.max(...highs);
};

module.exports.getSwingLow = (lows) => {
  return Math.min(...lows);
};

module.exports.getHigherHigh = (highs) => {
  return Math.max(...highs);
};

module.exports.getLowerLow = (lows) => {
  return Math.min(...lows);
};
