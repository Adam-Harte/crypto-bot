const axios = require('axios');
require("dotenv").config();

const utils = require('./utils');

const ocoOrderRequest = async (params) => {
  try {
    const res = await axios({
      method: "POST",
      url: 'https://testnet.binance.vision/api/v3/order/oco',
      params: utils.signPayload(params),
      headers: { "X-MBX-APIKEY": process.env.BINANCE_TEST_API_KEY },
    });
    return res;
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};

 const ocoOrder = (symbol, side, quantity, limitPrice, stopPrice, stopLimitPrice) => {
  return ocoOrderRequest({
    symbol,
    side,
    quantity,
    price: limitPrice,
    stopPrice,
    stopLimitPrice,
    stopLimitTimeInForce: 'GTC'
  });
};

module.exports = ocoOrder;
