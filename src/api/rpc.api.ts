import { Express } from "express";
import { Config } from "../config";

// RPC from env

const setupGetRpcApi = (app: Express) => {
  app.get("/hive/rpc", async (req, res) => {
    res.send({ rpc: Config.rpc });
  });
};
const setupGetHiveRpcApi = (app: Express) => {
  app.get("/hive/hive/rpc", async (req, res) => {
    res.send({ rpc: Config.hive_rpc });
  });
};

const setupApis = (app: Express) => {
  setupGetHiveRpcApi(app);
  setupGetRpcApi(app);
};

export const RpcApi = {
  setupApis,
};
