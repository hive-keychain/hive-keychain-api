require("dotenv").config();
import bodyParser from "body-parser";
import express from "express";
import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import https from "https";
import { BadActorsApi } from "./bad-actors/bad-actors.api";
import { Config } from "./config";
import { DelegationApi } from "./delegations/delegation.api";
import { PriceApi } from "./prices/price.api";
import { PriceLogic } from "./prices/price.logic";
import { RpcApi } from "./rpc/rpc.api";
import { SwapDataSource } from "./swaps/database/data-source";
import { SwapDatabaseModule } from "./swaps/database/typeorm";
import { SwapTokenLogic } from "./swaps/logic/swap-tokens/swap-token.logic";
import { SwapsLogic } from "./swaps/logic/swaps.logic";
import { SwapTokenApi } from "./swaps/swap-token.api";
import { VersionLogApi } from "./version-logs/version-log.api";
import { WitnessApi } from "./witnesses/witness.api";

var cors = require("cors");

const PORT = process.env.PORT || 3000;

const initServerRoutine = async () => {
  const app = express();
  Logger.initLogger(Config.logger, process.env.NODE_ENV);
  await SwapDatabaseModule.initDatabaseConnection(SwapDataSource);
  setupRoutes(app);
  setupRoutines();
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
  RpcApi.setupApis(app);
  VersionLogApi.setupApis(app);
  WitnessApi.setupApis(app);
  SwapTokenApi.setupApis(app);
};

const setupRoutines = () => {
  PriceLogic.initFetchPrices();
  SwapTokenLogic.initAutoRefreshTokenMarketPool();
  SwapsLogic.initializeSwapRoutine();
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
