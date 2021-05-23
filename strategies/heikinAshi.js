const calculateHeikinAshi = (heikinAshiCandle, results, open, high, low, close, inPosition) => {
  results.push(heikinAshiCandle.nextValue({
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close)
  }));

  console.log(results[results.length - 1]);

  if (results.length > 2) {
    if (results[results.length - 1].close > results[results.length - 2].close && results[results.length - 1].open >= results[results.length - 1].low) {
      console.log('Entering upward trend. Bullish!');
      if (!inPosition) {
        console.log(`Buy at ${close}`);
        // buy binance order logic here
        inPosition = true;
      }
    }

    if (results[results.length - 1].close < results[results.length - 2].close && results[results.length - 1].open > results[results.length - 1].close && results[results.length - 1].open >= results[results.length - 1].high) {
      console.log('Entering downward trend. Bearish!');
      if (inPosition) {
        console.log(`sell at ${close}`);
        // sell binance order logic here
        inPosition = false;
      }
    }
  }
};

module.exports = calculateHeikinAshi;
