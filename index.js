const webSocket = require('ws');

const rsiEmaEngulfingStrategy = require('./strategies/1min/rsi-ema-engulfing');

// todo: add error handling for when the api requests fail and binance requires us to stop communicating for a period of time
// todo: add utils method to ensure orders pass all filter chcks before placing order
// todo: seperate utils into seperate files and add utils for making trades and support and resistance levels

const stream = 'wss://testnet.binance.vision/ws/btcusdt@kline_1m';

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
      rsiEmaEngulfingStrategy(open, high, low, close);
    }
  });

  ws.on('close', () => {
    console.log('closed connection');
    setTimeout(() => connect(stream, reconnectInterval), reconnectInterval);
  });
}

connect(stream, 60000);
