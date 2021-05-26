const fs = require('fs');

const ta = require('technicalindicators');

const PERIOD = 14;
const RSI_OVERSOLD = 30;
const RSI_OVERBOUGHT = 70;

const inputRSI = {
  values: [],
  period: PERIOD
};

let inPositionRSI = false;
let lastBuy;
let profit = 0;

const calculateRSI = (close) => {
  inputRSI.values.push(parseFloat(close));

    if (inputRSI.values.length > PERIOD) {
      const rsi = ta.RSI.calculate(inputRSI);
      const latestRsi = rsi[rsi.length - 1];

      console.log(`The current RSI is ${latestRsi}`);

      if (latestRsi > RSI_OVERBOUGHT) {
        if (inPositionRSI) {
          console.log(`Sell! Sell! Sell! at ${close}`);
          try {
            fs.writeFileSync('C:/Users/adamh/Desktop/crypto-bot/logs/rsi.txt', `sell at ${close}` + "\n", { flag: 'a+' });
          } catch (err) {
              console.error(err)
          }
          // sell binance order logic here
          profit = close - lastBuy;
          inPositionRSI = false;
          try {
            fs.writeFileSync('C:/Users/adamh/Desktop/crypto-bot/logs/rsi.txt', `profit at ${profit}` + "\n", { flag: 'a+' });
          } catch (err) {
              console.error(err)
          }
        }
      }

      if (latestRsi < RSI_OVERSOLD) {
        if (!inPositionRSI) {
          console.log(`Buy! Buy! Buy! at ${close}`);
          try {
            fs.writeFileSync('C:/Users/adamh/Desktop/crypto-bot/logs/rsi.txt', `buy at ${close}` + "\n", { flag: 'a+' });
          } catch (err) {
              console.error(err)
          }
          // buy binance order logic here
          lastBuy = close;
          inPositionRSI = true;
        }
      }
    }
};

module.exports = calculateRSI;
