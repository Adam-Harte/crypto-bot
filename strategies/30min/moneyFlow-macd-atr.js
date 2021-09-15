const ta = require('technicalindicators');

const utils = require('../utils');
const account = require('../../api/account');
const exchangeInfo = require('../../api/exchangeInfo');
const candleSticks = require('../../api/candleSticks');
const limitOrder = require('../../api/limitOrder');
const ocoOrder = require('../../api/ocoOrder');
const queryOco = require('../../api/queryOco');

let inLongPosition = false;
let inShortPosition = false;
let balance = 0;
let orderListId = 0;
let orderQuantity = 0;
let tickPrecision = 0;

const inputMoneyFlow = {
  high: [],
  low: [],
  close: [],
  volume: [],
  period: 14
};

const inputMacd = {
  values: [],
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
};

const inputAtr = {
  high: [],
  low: [],
  close: [],
  period: 14
};

exchangeInfo('BTCUSDT').then(res => {
  const filters = res.data.symbols[0].filters;
  const priceFilter = filters.find(filter => filter.filterType === 'PRICE_FILTER');
  tickPrecision = utils.getTickSizePrecision(priceFilter.tickSize);
});

candleSticks('BTCUSDT', '1h', 50).then(res => {
  inputMoneyFlow.high = res.data.map(d => parseFloat(d[2]));
  inputMoneyFlow.low = res.data.map(d => parseFloat(d[3]));
  inputMoneyFlow.close = res.data.map(d => parseFloat(d[4]));
  inputMoneyFlow.volume = res.data.map(d => parseFloat(d[5]));

  inputMacd.values = res.data.map(d => parseFloat(d[4]));

  inputAtr.high = res.data.map(d => parseFloat(d[2]));
  inputAtr.low = res.data.map(d => parseFloat(d[3]));
  inputAtr.close = res.data.map(d => parseFloat(d[4]));
});

const moneyFlowMacdAtrStrategy = (high, low, close, volume) => {
  inputMoneyFlow.high.push(high);
  inputMoneyFlow.low.push(low);
  inputMoneyFlow.close.push(close);
  inputMoneyFlow.volume.push(volume);

  inputMacd.values.push(close);

  inputAtr.high.push(high);
  inputAtr.low.push(low);
  inputAtr.close.push(close);

  if (inputMacd.values.length > inputMacd.slowPeriod) {
    const moneyFlow = new ta.MFI.calculate(inputMoneyFlow);
    const macd = new ta.MACD.calculate(inputMacd);
    const atr = new ta.ATR.calculate(inputAtr);

    const latestMoneyFlow = moneyFlow[moneyFlow.length - 1];
    const previousMacd = macd[macd.length - 2];
    const latestMacd = macd[macd.length - 1];
    const latestAtr = atr[atr.length - 1];

    const moneyFlowUpwardTrend = latestMoneyFlow > 50;
    const moneyFlowDownwardTrend = latestMoneyFlow < 50;
    const macdCrossUp = previousMacd.MACD < previousMacd.signal && latestMacd.MACD > latestMacd.signal && latestMacd.histogram > 1;
    const macdCrossDown = previousMacd.MACD > previousMacd.signal && latestMacd.MACD < latestMacd.signal && latestMacd.histogram < 1;

    if (inLongPosition || inShortPosition) {
      queryOco(orderListId).then(res => {
        inLongPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
        inShortPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
      })
    }

    if (moneyFlowUpwardTrend && macdCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here
        const limitPrice = utils.format(close + (close - (close - latestAtr * 2)) * 2, tickPrecision);
        const stopPrice = utils.format(close - latestAtr * 2, tickPrecision);
        const stopLimitPrice = utils.format(close - latestAtr * 2 - 0.02, tickPrecision);

        utils.logPosition('Long', limitPrice, stopPrice, stopLimitPrice);

        if (utils.isProfitCoveringTradeFee('LONG', limitPrice, close)) {
          account()
            .then(acc => {
              balance = parseFloat(acc.data.balances.find(b => b.asset === 'USDT').free);
              orderQuantity = utils.getOrderQuantity(balance, 0.01, close);
              return limitOrder('BTCUSDT', 'BUY', orderQuantity, close);
            }).then(order => {
              return ocoOrder('BTCUSDT', 'SELL', orderQuantity, limitPrice, stopPrice, stopLimitPrice);
            })
            .then(ocoOrder => {
              orderListId = ocoOrder.data.orderListId;
              inLongPosition = true;
            });
        }
      }
    }

    if (moneyFlowDownwardTrend && macdCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here
        const limitPrice = utils.format(close - ((close + latestAtr * 2) - close) * 2, tickPrecision);
        const stopPrice = utils.format(close + latestAtr * 2, tickPrecision);
        const stopLimitPrice = utils.format(close + latestAtr * 2 + 0.02, tickPrecision);

        utils.logPosition('Short', limitPrice, stopPrice, stopLimitPrice);

        if (utils.isProfitCoveringTradeFee('SHORT', limitPrice, close)) {
          account()
            .then(acc => {
              balance = parseFloat(acc.data.balances.find(b => b.asset === 'USDT').free);
              orderQuantity = utils.getOrderQuantity(balance, 0.01, close);
              return limitOrder('BTCUSDT', 'SELL', orderQuantity, close);
            })
            .then(order => {
              return ocoOrder('BTCUSDT', 'BUY', orderQuantity, limitPrice, stopPrice, stopLimitPrice);
            })
            .then(ocoOrder => {
              orderListId = ocoOrder.data.orderListId;
              inShortPosition = true;
            });
        }
      }
    }
  }
}

module.exports = moneyFlowMacdAtrStrategy;
