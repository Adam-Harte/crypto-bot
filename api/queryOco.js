const axios = require('axios');
require("dotenv").config();

const utils = require('./utils');

const queryOcoRequest = async (params) => {
  try {
    const res = await axios({
      method: "GET",
      url: 'https://testnet.binance.vision/api/v3/orderList ',
      // url: 'https://testnet.binance.vision/api/v3/orderList ',
      params: utils.signPayload(params),
      headers: { "X-MBX-APIKEY": process.env.BINANCE_TEST_API_KEY },
    });
    return res;
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};

const queryOco = (orderListId) => {
  return queryOcoRequest({
    orderListId
  });
};

module.exports = queryOco;