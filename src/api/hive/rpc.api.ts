import { Express } from "express";
import { Config } from "../../config";
import { RpcLogic } from "../../logic/hive/rpcs.logic";

// RPC from env

const setupGetHiveRpcApi = (app: Express) => {
  //TODO : remove from extension and mobile and deprecate
  app.get("/hive/rpc", async (req, res) => {
    res.send({ rpc: Config.hive_rpc });
  });
  app.get("/hive/rpcs", async (req, res) => {
    res.status(200).send(await RpcLogic.getRPCs());
  });
};

const setupApis = (app: Express) => {
  setupGetHiveRpcApi(app);
};

export const RpcApi = {
  setupApis,
};
