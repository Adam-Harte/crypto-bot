const webSocket = require('ws');

const calculateRSI = require('./indicators/rsi');
const calculateHeikinAshi = require('./indicators/heikinAshi');
const calculateBollingerBands = require('./indicators/bollingerBands');
const calculateMacd = require('./indicators/macd');

const stream = 'wss://stream.binance.com:9443/ws/btcusdt@kline_5m';

const ws = new webSocket(stream);

ws.on('open', () => {
  console.log('opened connection');
});

ws.on('message', (message) => {
  const data = JSON.parse(message);
  const candle = data['k'];
  const isCandleClosed = candle['x'];
  const open = candle['o'];
  const high = candle['h'];
  const low = candle['l'];
  const close = candle['c'];

  if (isCandleClosed) {
    calculateRSI(close);
    calculateHeikinAshi(open, high, low, close);
    calculateBollingerBands(close);
    calculateMacd(close, 40);
  }
});

ws.on('close', () => {
  console.log('closed connection');
});
