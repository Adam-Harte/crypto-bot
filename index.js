const http = require('http');

const webSocket = require('ws');
const ta = require('technicalindicators');

const calculateRSI = require('./strategies/rsi');
const calculateHeikinAshi = require('./strategies/heikinAshi');
const calculateBollingerBands = require('./strategies/bollingerBands');
const calculateMacd = require('./strategies/macd');

const stream = 'wss://stream.binance.com:9443/ws/btcusdt@kline_1m';
const PERIOD = 14;
const RSI_OVERSOLD = 30;
const RSI_OVERBOUGHT = 70;

const inputRSI = {
  values: [],
  period: PERIOD
};

const inputHeikinAshi = {
  open: [],
  high: [],
  low: [],
  close: [],
  timestamp: [],
  volume: []
};

const inputBollingerBands = {
  period: PERIOD,
  values: [],
  stdDev: 2
};

const inputMACD = {
  values: [],
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
}

const heikinAshiResults = [];

let inPositionRSI = false;
let inPositionHeikinAshi = false;
let inPositionBollinger = false;
let inPositionMacd = false;

let heikinAshiCandle;

const server = http.createServer();
const ws = new webSocket(stream);

ws.on('open', () => {
  console.log('opened connection');
  heikinAshiCandle = new ta.HeikinAshi(inputHeikinAshi);
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
    calculateRSI(close, inputRSI, RSI_PERIOD, inPositionRSI, RSI_OVERBOUGHT, RSI_OVERSOLD);
    calculateHeikinAshi(heikinAshiCandle, heikinAshiResults, open, high, low, close, inPositionHeikinAshi);
    calculateBollingerBands(inputBollingerBands, PERIOD, close, inPositionBollinger);
    calculateMacd(inputMACD, close, 26, inPositionMacd);
  }
});

ws.on('close', () => {
  console.log('closed connection');
});

server.listen(3000);
