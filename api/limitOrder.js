const axios = require('axios');
require("dotenv").config();

const utils = require('./utils');

const limitOrderRequest = async (params) => {
  try {
    const data = await axios({
      method: "POST",
      url: 'https://testnet.binance.vision/api/v3/order',
      // url: 'https://testnet.binance.vision/api/v3/order',
      params: utils.signPayload(params),
      headers: { "X-MBX-APIKEY": process.env.BINANCE_TEST_API_KEY },
    });

    if (data.fills) {
      const { price, commission, qty } = data.fills[0];
      console.log(
        `Ordered ${qty}BTC at price ${price}, commission ${commission}.`,
      );
    } else {
      console.log(data);
    }
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};

const limitOrder = (symbol, side, quantity, price) => {
  limitOrderRequest({
    symbol,
    side,
    quantity,
    price,
    type: 'LIMIT',
    timeInForce: 'GTC',
  });
};

module.exports = limitOrder;