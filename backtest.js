const btcusdt = require('./historicalData/btc-usdt-4-hour');
const heikinAshiRsiStrategy = require('./strategies/heikinAshi-rsi');

btcusdt.forEach(candle => {
  const [openTime, open, high, low, close] = candle;

  heikinAshiRsiStrategy(parseFloat(open), parseFloat(high), parseFloat(low), parseFloat(close));
});
