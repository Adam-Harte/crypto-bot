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
