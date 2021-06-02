const axios = require('axios');
require("dotenv").config();

const getExchangeInfoRequest = async (params) => {
  try {
    const result = await axios({
      method: "GET",
      url: 'https://testnet.binance.vision/api/v3/exchangeInfo',
      params: {
        ...params
      },
      headers: { "X-MBX-APIKEY": process.env.BINANCE_TEST_API_KEY },
    });
    console.log(result.data.symbols[0].filters);
    return result;
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};

const exchangeInfo = (symbol) => {
  getExchangeInfoRequest({
    symbol
  });
};

module.exports = exchangeInfo;
