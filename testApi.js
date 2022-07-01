const account = require('./api/account');
const limitOrder = require('./api/limitOrder');
const ocoOrder = require('./api/ocoOrder');
const openOrders = require('./api/openOrders');
const allOrders = require('./api/allOrders');
const allOcoOrders = require('./api/queryAllOco');
const orderById = require('./api/orderById');
const cancelOrders = require('./api/cancelOrders');
const exchangeInfo = require('./api/exchangeInfo');
const candleSticks = require('./api/candleSticks');

// account();
// limitOrder('BTCUSDT', 'SELL', 0.01, 56500.00);
// ocoOrder('BTCUSDT', 'SELL', 0.1, 34000.0 * 1.4, 34000.0 * 0.8, 34000.0 * 0.7);
// openOrders('BTCUSDT');
// allOcoOrders();
// allOrders('BTCUSDT')
// orderById('BTCUSDT', 1031208);
// cancelOrders('BTCUSDT');
// exchangeInfo('BTCUSDT');
// candleSticks('BTCUSDT', '1m', 1000, 1577836800000).then(res => console.log(JSON.stringify(res.data)));
