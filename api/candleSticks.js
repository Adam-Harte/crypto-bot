const axios = require('axios');
require("dotenv").config();

const getCandleSticksRequest = async (params) => {
  try {
    const res = await axios({
      method: "GET",
      url: 'https://api.binance.com/api/v3/klines',
      params: {
        ...params
      },
      // headers: { "X-MBX-APIKEY": process.env.BINANCE_TEST_API_KEY },
    });
    return res;
  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};

const candleSticks = (symbol, interval, limit, startTime = undefined) => {
  return getCandleSticksRequest({
    symbol,
    interval,
    limit,
    ...(startTime && {
      startTime
    })
  });
};

module.exports = candleSticks;
