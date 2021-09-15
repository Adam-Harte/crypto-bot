module.exports.getOrderQuantity = (balance, risk, coinPrice) => {
  const riskAmount = balance * risk;
  const quantityToOrder = riskAmount / coinPrice;

  return roundTo(quantityToOrder, 4);
};

module.exports.format = (value, decimals) => {
  return roundTo(value, decimals);
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
