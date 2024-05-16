require("dotenv").config();
import bodyParser from "body-parser";
import express from "express";
import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import https from "https";
import { TokensBackgroundColorsApi } from "./api/background-color.api";
import { BadActorsApi } from "./api/bad-actors.api";
import { DelegationApi } from "./api/delegation.api";
import { EcosystemApi } from "./api/ecosystem.api";
import { GasPriceEstimateApi } from "./api/evm/gas-price-estimate.api";
import { TokensInfoApi } from "./api/evm/token-info.api";
import { HistoricalDataApi } from "./api/historical-data.api";
import { PriceApi } from "./api/price.api";
import { RpcApi } from "./api/rpc.api";
import { VersionLogApi } from "./api/version-log.api";
import { WitnessApi } from "./api/witness.api";
import { Config } from "./config";
import { HistoricalDataLogic } from "./logic/historical-data.logic";
import { PriceLogic } from "./logic/price.logic";
import { TokensBackgroundColorsLogic } from "./logic/token-background-color";

var cors = require("cors");

const PORT = process.env.PORT || 3000;

const initServerRoutine = () => {
  const app = express();
  Logger.initLogger(Config.logger, process.env.NODE_ENV);
  setupRoutes(app);

  PriceLogic.initFetchPrices();
  HistoricalDataLogic.init();
  TokensBackgroundColorsLogic.initFetchColorMap();
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
  TokensInfoApi.setupApis(app);
  GasPriceEstimateApi.setupApis(app);
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
