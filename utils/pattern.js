module.exports.getBullishEngulfing = (oldOpen, oldClose, previousOpen, previousClose, latestOpen, latestClose) => {
  const immediateEngulfing = previousOpen > previousClose && latestClose > latestOpen && latestClose - latestOpen > previousOpen - previousClose;
  const delayedEngulfing = oldOpen > oldClose && previousClose > previousOpen && latestClose > latestOpen && latestClose - latestOpen > oldOpen - oldClose;
  return immediateEngulfing || delayedEngulfing;
};

module.exports.getBearishEngulfing = (oldOpen, oldClose, previousOpen, previousClose, latestOpen, latestClose) => {
  const immediateEngulfing = previousClose > previousOpen && latestOpen > latestClose && latestOpen - latestClose > previousClose - previousOpen;
  const delayedEngulfing = oldClose > oldOpen && previousOpen > previousClose && latestOpen > latestClose && latestOpen - latestClose > oldClose - oldOpen;
  return immediateEngulfing || delayedEngulfing;
};

module.exports.getBullishPinBar = (open, low, high, close) => {
  const redCandlePinBar = open > close && (close - low) / (open - close) > 3 && (open - close) / (high - open) > 2;
  const greenCandlePinBar = close > open && (open - low) / (close - open) > 3 && (close - open) / (high - close) > 2;
  return redCandlePinBar || greenCandlePinBar;
};

module.exports.getBearishPinBar = (open, low, high, close) => {
  const redCandlePinBar = open > close && (high - open) / (open - close) > 3 && (open - close) / (close - low) > 2;
  const greenCandlePinBar = close > open && (high - close) / (close - open) > 3 && (close - open) / (open - low) > 2;
  return redCandlePinBar || greenCandlePinBar;
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
