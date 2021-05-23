const http = require('http');

const webSocket = require('ws');
const ta = require('technicalindicators');


const stream = 'wss://stream.binance.com:9443/ws/btcusdt@kline_1m';
const RSI_PERIOD = 14;
const RSI_OVERSOLD = 30;
const RSI_OVERBOUGHT = 70;

const inputRSI = {
  values: [],
  period: RSI_PERIOD
};

let inPosition = false;

const server = http.createServer();
const ws = new webSocket(stream);

ws.on('open', () => {
  console.log('opened connection');
});

ws.on('message', (message) => {
  const data = JSON.parse(message);
  const candle = data['k'];
  const isCandleClosed = candle['x'];
  const close = candle['c'];

  if (isCandleClosed) {
    inputRSI.values.push(parseFloat(close));

    if (inputRSI.values.length > RSI_PERIOD) {
      const rsi = ta.RSI.calculate(inputRSI);
      const latestRsi = rsi[rsi.length - 1];

      console.log(`The current RSI is ${latestRsi}`);

      if (latestRsi > RSI_OVERBOUGHT) {
        if (inPosition) {
          console.log('Sell! Sell! Sell!');
          // sell binance order logic here
          inPosition = false;
        }
      }

      if (latestRsi < RSI_OVERSOLD) {
        if (!inPosition) {
          console.log('Buy! Buy! Buy!');
          // buy binance order logic here
          inPosition = true;
        }
      }
    }
  }

});

ws.on('close', () => {
  console.log('closed connection');
});

server.listen(3000);
