const axios = require('axios');
require("dotenv").config();

const utils = require('./utils');

const cancelOrdersRequest = async (params) => {
  try {
    const data = await axios({
      method: "DELETE",
      url: 'https://testnet.binance.vision/api/v3/openOrders',
      params: utils.signPayload(params),
      headers: { "X-MBX-APIKEY": process.env.BINANCE_TEST_API_KEY },
    });
    console.log(data);
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};

const cancelOrders = (symbol) => {
  cancelOrdersRequest({
    symbol
  });
};

module.exports = cancelOrders;
