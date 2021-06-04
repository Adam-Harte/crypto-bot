const axios = require('axios');
require("dotenv").config();

const getExchangeInfoRequest = async (params) => {
  try {
    const res = await axios({
      method: "GET",
      url: 'https://testnet.binance.vision/api/v3/exchangeInfo',
      params: {
        ...params
      },
      headers: { "X-MBX-APIKEY": process.env.BINANCE_TEST_API_KEY },
    });
    return res;
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};

const exchangeInfo = (symbol) => {
  return getExchangeInfoRequest({
    symbol
  });
};

module.exports = exchangeInfo;
