require("dotenv").config();
import bodyParser from "body-parser";
import express from "express";
import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import https from "https";
import { EcosystemApi } from "./api/ecosystem.api";
import { GasPriceEstimateApi } from "./api/evm/gas-price-estimate.api";
import { SmartContractsApi } from "./api/evm/smart-contracts-info.api";
import { VerifyTransactionApi } from "./api/evm/verify-transaction.api";
import { TokensBackgroundColorsApi } from "./api/hive/background-color.api";
import { BadActorsApi } from "./api/hive/bad-actors.api";
import { DelegationApi } from "./api/hive/delegation.api";
import { HistoricalDataApi } from "./api/hive/historical-data.api";
import { InvoiceRedirectApi } from "./api/hive/invoice-redirect.api";
import { PriceApi } from "./api/hive/price.api";
import { RpcApi } from "./api/hive/rpc.api";
import { WitnessApi } from "./api/hive/witness.api";
import { SettingsApi } from "./api/mobile-settings.api";
import { VersionLogApi } from "./api/version-log.api";
import { Config } from "./config";
import { CoingeckoConfigLogic } from "./logic/evm/coingecko-config";
import { MetaMaskBlacklistLogic } from "./logic/evm/verify-transaction/metamask.logic";
import { ScamSnifferLogic } from "./logic/evm/verify-transaction/scamsniffer.logic";
import { HistoricalDataLogic } from "./logic/hive/historical-data.logic";
import { PriceLogic } from "./logic/hive/price.logic";
import { TokensBackgroundColorsLogic } from "./logic/hive/token-background-color";

var cors = require("cors");

const PORT = process.env.PORT || 3000;

const initServerRoutine = () => {
  const app = express();
  Logger.initLogger(Config.logger, process.env.NODE_ENV || "development");
  setupRoutes(app);

  setTimeout(() => PriceLogic.initFetchPrices(), 2 * 60 * 1000);
  HistoricalDataLogic.init();
  TokensBackgroundColorsLogic.initFetchColorMap();
  CoingeckoConfigLogic.initFetchCoingeckoConfig();
  ScamSnifferLogic.initFetchScamSniffer();
  MetaMaskBlacklistLogic.initFetchMetamaskBlacklist();
  startServer(app);
};

const setupRoutes = (app: express.Express) => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.static("public", { dotfiles: "allow" }));
  //CORS
  app.use(cors());

  BadActorsApi.setupApis(app);
  DelegationApi.setupApis(app);
  PriceApi.setupApis(app);
  HistoricalDataApi.setupApis(app);
  RpcApi.setupApis(app);
  VersionLogApi.setupApis(app);
  WitnessApi.setupApis(app);
  TokensBackgroundColorsApi.setupApis(app);
  EcosystemApi.setupApis(app);
  SmartContractsApi.setupApis(app);
  GasPriceEstimateApi.setupApis(app);
  VerifyTransactionApi.setupApis(app);
  SettingsApi.setupApis(app);
  InvoiceRedirectApi.setupApis(app);
};

const startServer = (app: express.Express) => {
  if (!process.env.DEV) {
    https
      .createServer(
        {
          key: fs.readFileSync(
            "/etc/letsencrypt/live/api.hive-keychain.com/privkey.pem",
            "utf8"
          ),
          cert: fs.readFileSync(
            "/etc/letsencrypt/live/api.hive-keychain.com/cert.pem",
            "utf8"
          ),
          ca: fs.readFileSync(
            "/etc/letsencrypt/live/api.hive-keychain.com/chain.pem",
            "utf8"
          ),
        },
        app
      )
      .listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
  } else {
    app.listen(PORT, () => {
      Logger.technical(`Running on port ${PORT}`);
    });
  }
};

initServerRoutine();
