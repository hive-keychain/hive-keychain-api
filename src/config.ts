import path from "path";

require("dotenv").config();

export const Config = {
  hiveSql: {
    user: process.env.LOGIN!,
    password: process.env.PASSWORD!,
    server: process.env.SQL_API!,
    database: process.env.DB!,
    options: {
      encrypt: true, // Required if you're using Azure or encryption
      trustServerCertificate: true, // Use true only in dev environments
    },
    requestTimeout: 60000,
  },
  rpc: process.env.RPC,
  hive_rpc: process.env.HIVE_RPC,
  logger: {
    folder: path.join(__dirname, "..", "logs"),
    file: "lease-market-%DATE%.log",
    levels: {
      TECHNICAL: 1,
      INFO: 1,
      ERROR: 0,
      OPERATION: 1,
      DEBUG: 1,
      WARN: 1,
    },
  },
};
