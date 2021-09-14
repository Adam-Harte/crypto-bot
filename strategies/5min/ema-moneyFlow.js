const ta = require('technicalindicators');

const utils = require('../utils');
const candleSticks = require('../../api/candleSticks');
const limitOrder = require('../../api/limitOrder');
const ocoOrder = require('../../api/ocoOrder');

let inLongPosition = false;
let inShortPosition = false;

const inputEma200 = {
  period: 200,
  values: []
};

const inputMoneyFlow = {
  high: [],
  low: [],
  close: [],
  volume: [],
  period: 14
};

candleSticks('BTCUSDT', '5m', 200).then(res => {
  inputEma200.values = res.data.map(d => parseFloat(d[4]));

  inputMoneyFlow.high = res.data.map(d => parseFloat(d[2]));
  inputMoneyFlow.low = res.data.map(d => parseFloat(d[3]));
  inputMoneyFlow.close = res.data.map(d => parseFloat(d[4]));
  inputMoneyFlow.volume = res.data.map(d => parseFloat(d[5]));
});

const moneyFlowMacdAtrStrategy = (high, low, close, volume) => {
  inputEma200.values.push(close);
  inputMoneyFlow.high.push(high);
  inputMoneyFlow.low.push(low);
  inputMoneyFlow.close.push(close);
  inputMoneyFlow.volume.push(volume);

  if (inputMacd.values.length > inputMacd.slowPeriod) {
    const ema200 = new ta.EMA.calculate(inputEma200);
    const moneyFlow = new ta.MFI.calculate(inputMoneyFlow);

    const latestEma200 = ema200[ema200.length - 1];
    const latestMoneyFlow = moneyFlow[moneyFlow.length - 1];

    const aboveEma = close > latestEma200;
    const belowEma = close < latestEma200;
    const moneyFlowOverBought = latestMoneyFlow > 80;
    const moneyFlowOverSold = latestMoneyFlow < 20;

    if (aboveEma && moneyFlowOverSold) {
      if (!inLongPosition) {
        // buy binance order logic here
        console.log('Long');
        console.log('limit price: ', utils.format(close + (close - (close - latestAtr * 2)) * 2, 2));
        console.log('stop price: ', utils.format(close - latestAtr * 2, 2));
        console.log('stop limit price: ', utils.format(close - latestAtr * 2 - 0.02, 2));
        console.log('atr', latestAtr);
        limitOrder('BTCUSDT', 'BUY', 0.001, close);
        ocoOrder('BTCUSDT', 'SELL', 0.001, utils.format(close + (close - (close - latestAtr * 2)) * 2, 2), utils.format(close - latestAtr * 2, 2), utils.format(close - latestAtr * 2 - 0.02, 2));
        inLongPosition = true;
        inShortPosition = false;
      }
    }

    if (belowEma && moneyFlowOverBought) {
      if (!inShortPosition) {
        // sell binance order logic here
        console.log('Short');
        console.log('limit price: ', utils.format(close - ((close + latestAtr * 2) - close) * 2, 2));
        console.log('stop price: ', utils.format(close + latestAtr * 2, 2));
        console.log('stop limit price: ', utils.format(close + latestAtr * 2 + 0.02, 2));
        console.log('atr', latestAtr);
        limitOrder('BTCUSDT', 'SELL', 0.001, close);
        ocoOrder('BTCUSDT', 'BUY', 0.001, utils.format(close - ((close + latestAtr * 2) - close) * 2, 2), utils.format(close + latestAtr * 2, 2), utils.format(close + latestAtr * 2 + 0.02, 2));
        inShortPosition = true;
        inLongPosition = false;
      }
    }
  }
}

module.exports = moneyFlowMacdAtrStrategy;
