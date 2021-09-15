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

let min15Count = 3;
let hour1Count = 12;

const inputEma1h50 = {
  period: 50,
  values: []
};

const inputEma15m50 = {
  period: 50,
  values: []
};

const inputMacd = {
  values: [],
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9,
  SimpleMAOscillator: false,
  SimpleMASignal: false
};

let highs = [];
let lows = [];

exchangeInfo('BTCUSDT').then(res => {
  const filters = res.data.symbols[0].filters;
  const priceFilter = filters.find(filter => filter.filterType === 'PRICE_FILTER');
  tickPrecision = utils.getTickSizePrecision(priceFilter.tickSize);
});

candleSticks('BTCUSDT', '1h', 50).then(res => {
  inputEma1h50.values = res.data.map(d => parseFloat(d[4]));
});

candleSticks('BTCUSDT', '15m', 50).then(res => {
  inputEma15m50.values = res.data.map(d => parseFloat(d[4]));
});

candleSticks('BTCUSDT', '5m', 50).then(res => {
  inputMacd.values = res.data.map(d => parseFloat(d[4]));

  highs = res.data.map(d => parseFloat(d[2]));
  lows = res.data.map(d => parseFloat(d[3]));
});

const mtfEmaMacdStrategy = (open, high, low, close) => {
  min15Count--;
  hour1Count--;

  if (min15Count === 0) {
    inputEma15m50.values.push(close);
    min15Count = 3;
  }

  if (hour1Count === 0) {
    inputEma1h50.values.push(close);
    hour1Count = 12;
  }

  inputMacd.values.push(close);
  highs.push(high);
  lows.push(low);

  if (inputEma1h50.values.length > inputEma1h50.period) {
    const ema1h50 = new ta.EMA.calculate(inputEma1h50);
    const ema15m50 = new ta.EMA.calculate(inputEma15m50);
    const macd = new ta.MACD.calculate(inputMacd);

    const latestEma1h50 = ema1h50[ema1h50.length - 1];
    const latestEma15m50 = ema15m50[ema15m50.length - 1];
    const previousMacd = macd[macd.length - 2];
    const latestMacd = macd[macd.length - 1];

    const aboveEma1h = latestEma15m50 > latestEma1h50;
    const belowEma1h = latestEma15m50 < latestEma1h50;
    const macdHiddenBullishDivergence = utils.getHiddenBullishDivergence(lows, macd.map(m => m.MACD)) && utils.getHiddenBullishDivergence(lows, macd.map(m => m.signal));
    const macdHiddenBearishDivergence = utils.getHiddenBearishDivergence(highs, macd.map(m => m.MACD)) && utils.getHiddenBearishhDivergence(highs, macd.map(m => m.signal));
    const macdCrossUp = previousMacd.MACD < previousMacd.signal && latestMacd.MACD > latestMacd.signal && latestMacd.histogram < 1;
    const macdCrossDown = previousMacd.MACD > previousMacd.signal && latestMacd.MACD < latestMacd.signal && latestMacd.histogram > 1;

    if (inLongPosition || inShortPosition) {
      queryOco(orderListId).then(res => {
        inLongPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
        inShortPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
      })
    }

    if (aboveEma1h && macdHiddenBullishDivergence && macdCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here
        const limitPrice = utils.format(close + ((close - utils.getSwingLow(lows)) * 2), tickPrecision);
        const stopPrice = utils.format(utils.getSwingLow(lows) - 0.02, tickPrecision);
        const stopLimitPrice = utils.format(utils.getSwingLow(lows) - 0.03, tickPrecision);
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

    if (belowEma1h && macdHiddenBearishDivergence && macdCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here
        const limitPrice = utils.format(close - ((utils.getSwingHigh(highs) - close) * 2), tickPrecision);
        const stopPrice = utils.format(utils.getSwingHigh(highs) + 0.02, tickPrecision);
        const stopLimitPrice = utils.format(utils.getSwingHigh(highs) + 0.03, tickPrecision);
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

module.exports = mtfEmaMacdStrategy;
