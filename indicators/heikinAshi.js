const fs = require('fs');

const ta = require('technicalindicators');

let inPositionHeikinAshi = false;
let lastBuy;
let profit = 0;

const inputHeikinAshi = {
  open: [],
  high: [],
  low: [],
  close: [],
  timestamp: [],
  volume: []
};

const heikinAshiResults = [];
const heikinAshiCandle = new ta.HeikinAshi(inputHeikinAshi);

const calculateHeikinAshi = (open, high, low, close) => {
  heikinAshiResults.push(heikinAshiCandle.nextValue({
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close)
  }));

  if (heikinAshiResults.length > 2) {
    const previousHeikinAshi = heikinAshiResults[heikinAshiResults.length - 2];
    const latestHeikinAshi = heikinAshiResults[heikinAshiResults.length - 1];

    const bullishIndicator = latestHeikinAshi.close > previousHeikinAshi.close && latestHeikinAshi.close > latestHeikinAshi.open && (parseFloat(((latestHeikinAshi.close - latestHeikinAshi.open) / latestHeikinAshi.close) * 100 > 0.8).toFixed(3));
    const buySignal = bullishIndicator && latestHeikinAshi.open >= latestHeikinAshi.low;
    const sellSignal = latestHeikinAshi.close < previousHeikinAshi.close && latestHeikinAshi.open > latestHeikinAshi.close && latestHeikinAshi.open >= latestHeikinAshi.high;

    if (buySignal) {
      console.log('Entering upward trend. Bullish!');
      if (!inPositionHeikinAshi) {
        console.log(`Buy at ${close}`);
        try {
          fs.writeFileSync('C:/Users/adamh/Desktop/crypto-bot/logs/heikinAshi.txt', `buy at ${close}` + "\n", { flag: 'a+' });
        } catch (err) {
            console.error(err)
        }
        // buy binance order logic here
        lastBuy = close;
        inPositionHeikinAshi = true;
      }
    }

    if (sellSignal) {
      console.log('Entering downward trend. Bearish!');
      if (inPositionHeikinAshi) {
        console.log(`sell at ${close}`);
        try {
          fs.writeFileSync('C:/Users/adamh/Desktop/crypto-bot/logs/heikinAshi.txt', `sell at ${close}` + "\n", { flag: 'a+' });
        } catch (err) {
            console.error(err)
        }
        // sell binance order logic here
        profit = close - lastBuy;
        inPositionHeikinAshi = false;
        try {
          fs.writeFileSync('C:/Users/adamh/Desktop/crypto-bot/logs/heikinAshi.txt', `profit at ${profit}` + "\n", { flag: 'a+' });
        } catch (err) {
            console.error(err)
        }
      }
    }
  }
};

module.exports = calculateHeikinAshi;
