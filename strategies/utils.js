const roundTo = require('round-to');

// add support level, resistance level, filter check

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

module.exports.getOrderQuantity = (balance, risk, coinPrice) => {
  const riskAmount = balance * risk;
  const quantityToOrder = riskAmount / coinPrice;

  return roundTo(quantityToOrder, 4);
};

module.exports.format = (value, decimals) => {
  return roundTo(value, decimals);
};

module.exports.getBullishEngulfing = (previousOpen, previousClose, latestOpen, latestClose) => {
  return previousOpen > previousClose && latestClose > latestOpen && latestClose - latestOpen > previousOpen - previousClose;
}

module.exports.getBearishEngulfing = (previousOpen, previousClose, latestOpen, latestClose) => {
  return previousClose > previousOpen && latestOpen > latestClose && latestOpen - latestClose > previousClose - previousOpen;
}

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


