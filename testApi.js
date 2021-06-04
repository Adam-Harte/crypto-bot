const account = require('./api/account');
const limitOrder = require('./api/limitOrder');
const ocoOrder = require('./api/ocoOrder');
const openOrders = require('./api/openOrders');
const allOrders = require('./api/allOrders');
const orderById = require('./api/orderById');
const cancelOrders = require('./api/cancelOrders');
const exchangeInfo = require('./api/exchangeInfo');
const candleSticks = require('./api/candleSticks');

// account();
// limitOrder('BTCUSDT', 'BUY', 0.1, 10000.00);
// ocoOrder('BTCUSDT', 'SELL', 0.1, 34000.0 * 1.4, 34000.0 * 0.8, 34000.0 * 0.7);
// openOrders('BTCUSDT');
// allOrders('BTCUSDT');
// orderById('BTCUSDT', 1);
// cancelOrders('BTCUSDT');
// exchangeInfo('BTCUSDT');
// candleSticks('BTCUSDT', '15m', 10);
