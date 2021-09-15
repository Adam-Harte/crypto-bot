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

const inputEma8 = {
  period: 8,
  values: []
};

const inputEma14 = {
  period: 14,
  values: []
};

const inputEma50 = {
  period: 50,
  values: []
};

const inputStochastic = {
  values: [],
  rsiPeriod: 14,
  stochasticPeriod: 14,
  kPeriod: 3,
  dPeriod: 3
};

const inputAtr = {
  high: [],
  low: [],
  close: [],
  period: 14,
};

exchangeInfo('BTCUSDT').then(res => {
  const filters = res.data.symbols[0].filters;
  const priceFilter = filters.find(filter => filter.filterType === 'PRICE_FILTER');
  tickPrecision = utils.getTickSizePrecision(priceFilter.tickSize);
});

candleSticks('BTCUSDT', '1h', 50).then(res => {
  inputEma8.values = res.data.map(d => parseFloat(d[4]));
  inputEma14.values = res.data.map(d => parseFloat(d[4]));
  inputEma50.values = res.data.map(d => parseFloat(d[4]));

  inputStochastic.values = res.data.map(d => parseFloat(d[4]));

  inputAtr.high = res.data.map(d => parseFloat(d[2]));
  inputAtr.low = res.data.map(d => parseFloat(d[3]));
  inputAtr.close = res.data.map(d => parseFloat(d[4]));
});

const tripleEmaStochasticAtrStrategy = (high, low, close) => {
  inputEma8.values.push(close);
  inputEma14.values.push(close);
  inputEma50.values.push(close);
  inputStochastic.values.push(close);
  inputAtr.high.push(high);
  inputAtr.low.push(low);
  inputAtr.close.push(close);

  if (inputEma50.values.length > inputEma50.period) {
    const ema8 = new ta.EMA.calculate(inputEma8);
    const ema14 = new ta.EMA.calculate(inputEma14);
    const ema50 = new ta.EMA.calculate(inputEma50);
    const stochastic = new ta.StochasticRSI.calculate(inputStochastic);
    const atr = new ta.ATR.calculate(inputAtr);

    const latestEma8 = ema8[ema8.length - 1];
    const latestEma14 = ema14[ema14.length - 1];
    const latestEma50 = ema50[ema50.length - 1];
    const previousStochastic = stochastic[stochastic.length - 2];
    const latestStochastic = stochastic[stochastic.length - 1];
    const latestAtr = atr[atr.length - 1];

    const aboveEma = low > latestEma8;
    const belowEma = high < latestEma8;
    const emaUpwardTrend = latestEma8 > latestEma14 && latestEma14 > latestEma50;
    const emaDownwardTrend = latestEma50 > latestEma14 && latestEma14 > latestEma8;
    const stochasticCrossUp = previousStochastic.k < previousStochastic.d && latestStochastic.k > latestStochastic.d;
    const stochasticCrossDown = previousStochastic.k > previousStochastic.d && latestStochastic.k < latestStochastic.d;

    if (inLongPosition || inShortPosition) {
      queryOco(orderListId).then(res => {
        inLongPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
        inShortPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
      })
    }

    if (aboveEma && emaUpwardTrend && stochasticCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here
        const limitPrice = utils.format(close + latestAtr * 2, tickPrecision);
        const stopPrice = utils.format(close - latestAtr * 3, tickPrecision);
        const stopLimitPrice = utils.format(close - latestAtr * 3 - 0.02, tickPrecision);

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

    if (belowEma && emaDownwardTrend && stochasticCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here
        const limitPrice = utils.format(close - latestAtr * 2, tickPrecision);
        const stopPrice = utils.format(close + latestAtr * 3, tickPrecision);
        const stopLimitPrice = utils.format(close + latestAtr * 3 + 0.02, tickPrecision);

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

module.exports = tripleEmaStochasticAtrStrategy;
