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

module.exports.logPosition = (position, limitPrice, stopPrice, stopLimitPrice) => {
  console.log('- - - - - - - - - - - - - - - ');
  console.log(position);
  console.log('limit price: ', limitPrice);
  console.log('stop price: ', stopPrice);
  console.log('stop limit price: ', stopLimitPrice);
  console.log('- - - - - - - - - - - - - - - ');
};

module.exports.logPriceAction = (open, high, low, close) => {
  console.log('- - - - - - - - - - - - - - - ');
  console.log('open: ', open);
  console.log('high: ', high);
  console.log('low: ', low);
  console.log('close: ', close);
  console.log('- - - - - - - - - - - - - - - ');
};

module.exports.isProfitCoveringTradeFee = (type, limitPrice, close) => {
  if (type === "LONG") {
    return limitPrice - close > close * 0.001;
  } else if (type === "SHORT") {
    return close - limitPrice > close * 0.001
  }
};

module.exports.getTickSizePrecision = (tickSize) => {
  const precision = tickSize.split('.')[1].split('1')[0].length + 1;

  return precision;
};

module.exports.isOcoOrderFilled = (listOrderStatus) => {
  return listOrderStatus === "ALL_DONE";
};


