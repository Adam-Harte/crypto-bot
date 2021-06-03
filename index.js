const webSocket = require('ws');

const heikinAshiRsiStrategy = require('./strategies/heikinAshi-rsi');

const stream = 'wss://testnet.binance.vision/ws/btcusdt@kline_15m';

const connect = (stream, reconnectInterval) => {
  const ws = new webSocket(stream);

  ws.on('open', () => {
    console.log('opened connection');
  });

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const candle = data['k'];
    const isCandleClosed = candle['x'];
    const open = parseFloat(candle['o']);
    const high = parseFloat(candle['h']);
    const low = parseFloat(candle['l']);
    const close = parseFloat(candle['c']);

    if (isCandleClosed) {
      heikinAshiRsiStrategy(open, high, low, close);
    }
  });

  ws.on('close', () => {
    console.log('closed connection');
    setTimeout(connect, reconnectInterval);
  });
}

connect(stream, 60000);
