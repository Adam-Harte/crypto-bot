const crypto = require('crypto');

const qs = require('qs');
require("dotenv").config();

module.exports.signPayload = (payload) => {
  const data = { ...payload, timestamp: Date.now() - 1000 };
  const signature = crypto
    .createHmac("sha256", process.env.BINANCE_TEST_SECRET_KEY)
    .update(qs.stringify(data))
    .digest("hex");
  return { ...data, signature };
};
