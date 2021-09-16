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

const inputVwap = {
  open: [],
  high: [],
  low: [],
  close: [],
  volume: [],
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

candleSticks('BTCUSDT', '30m', 200).then(res => {
  inputVwap.open = res.data.map(d => parseFloat(d[1]));
  inputVwap.high = res.data.map(d => parseFloat(d[2]));
  inputVwap.low = res.data.map(d => parseFloat(d[3]));
  inputVwap.close = res.data.map(d => parseFloat(d[4]));
  inputVwap.volume = res.data.map(d => parseFloat(d[5]));
  inputMacd.values = res.data.map(d => parseFloat(d[4]));

  highs = res.data.map(d => parseFloat(d[2]));
  lows = res.data.map(d => parseFloat(d[3]));
});

const vwapMacdStrategy = (open, high, low, close, volume) => {
  inputVwap.open.push(open);
  inputVwap.high.push(high);
  inputVwap.low.push(low);
  inputVwap.close.push(close);
  inputVwap.volume.push(volume);
  inputMacd.values.push(close);
  highs.push(high);
  lows.push(low);

  if (inputEma200.values.length > inputEma200.period) {
    const vwap = new ta.VWAP.calculate(inputVwap);
    const macd = new ta.MACD.calculate(inputMacd);

    const latestVwap = vwap[vwap.length - 1];
    const oldVwap = vwap[vwap.length - 3];
    const previousMacd = macd[macd.length - 2];
    const latestMacd = macd[macd.length - 1];

    const aboveVwap = low > latestVwap;
    const belowVwap = high < latestVwap;
    const vwapUpwardTrend = latestVwap > oldVwap + 50;
    const vwapDownwardTrend = latestEma200 < oldVwap - 50;
    const macdCrossUp = previousMacd.MACD < previousMacd.signal && latestMacd.MACD > latestMacd.signal && latestMacd.histogram < 1;
    const macdCrossDown = previousMacd.MACD > previousMacd.signal && latestMacd.MACD < latestMacd.signal && latestMacd.histogram > 1;

    if (inLongPosition || inShortPosition) {
      queryOco(orderListId).then(res => {
        inLongPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
        inShortPosition = !utils.isOcoOrderFilled(res.data.listOrderStatus);
      })
    }

    if (vwapUpwardTrend && aboveVwap && macdCrossUp) {
      if (!inLongPosition) {
        // buy binance order logic here
        const limitPrice = utils.format(close + ((close - utils.getSwingLow(lows)) * 1.5), tickPrecision);
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

    if (vwapDownwardTrend && belowVwap && macdCrossDown) {
      if (!inShortPosition) {
        // sell binance order logic here
        const limitPrice = utils.format(close - ((utils.getSwingHigh(highs) - close) * 1.5), tickPrecision);
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

module.exports = vwapMacdStrategy;
