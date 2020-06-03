require("dotenv").config();

const config_api = {
  user: process.env.LOGIN,
  password: process.env.PASSWORD,
  server: process.env.SQL_API,
  database: process.env.DB,
  requestTimeout: 60000
};

const config = {
  config_api,
  rpc: process.env.RPC,
  hive_rpc: process.env.HIVE_RPC
};

module.exports = config;
