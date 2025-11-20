import { SwapCryptosConfig } from "hive-keychain-commons";
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
  swapCryptos: {
    stealthex: {
      urls: {
        baseUrl: "https://api.stealthex.io/v4/",
        referalBaseUrl: "https://stealthex.io/?ref=",
        fullLinkToExchange: "https://stealthex.io/exchange?id=",
        routes: {
          allCurrencies: "currencies",
          minMaxAccepted: "rates/range",
          currencyPair: "currencies/",
          estimation: "rates/estimated-amount",
          exchange: "fee/exchange",
        },
      },
      apiKey: process.env.STEALTHEX_DEV_API_KEY,
      refId: "gti0epcrc4c",
      partnerFeeAmount: 0.2,
    } as SwapCryptosConfig,
    simpleswap: {
      //Note: this exchange set up its partner fee in: https://partners.simpleswap.io/webtools/api
      // it seems it only accepts 5% as max value.
      urls: {
        baseUrl: "https://api.simpleswap.io/",
        referalBaseUrl: "https://simpleswap.io/?ref=",
        fullLinkToExchange: "https://simpleswap.io/exchange?id=",
        routes: {
          allCurrencies: "v3/currencies",
          currencyPair: "get_pairs",
          minMaxAccepted: "v3/ranges",
          estimation: "v3/estimates",
          exchange: "create_exchange",
        },
      },
      apiKey: process.env.SIMPLESWAP_DEV_API_KEY,
      refId: "87338fbedd5a",
    } as SwapCryptosConfig,
    letsExchange: {
      urls: {
        baseUrl: "https://api.letsexchange.io/api/",
        referalBaseUrl: "https://letsexchange.io/?ref_id=",
        routes: {
          allCurrencies: "v2/coins",
          minMaxAccepted: "v1/info",
          estimation: "v1/info",
        },
      },
      apiKey: process.env.LETS_EXCHANGE_DEV_API_KEY,
      refId: "gesatTarQ0Gk86Nn",
    } as SwapCryptosConfig,
    changelly: {
      urls: {
        baseUrl: "https://api.changelly.com/v1/",
        referalBaseUrl: "https://changelly.com/?ref_id=",
        routes: {
          allCurrencies: "currencies",
          minMaxAccepted: "currencies",
          estimation: "currencies",
          exchange: "currencies",
        },
      },
      apiKey: process.env.CHANGELLY_DEV_API_KEY,
      refId: "87338fbedd5a",
    } as SwapCryptosConfig,
  },
};
