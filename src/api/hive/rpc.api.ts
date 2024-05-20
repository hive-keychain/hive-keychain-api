import { Express } from "express";
import { Config } from "../../config";
import { RpcLogic, RpcStatusType } from "../../logic/hive/rpcs.logic";

// RPC from env

const setupGetHiveRpcApi = (app: Express) => {
  //TODO : remove from extension and mobile and deprecate
  app.get("/hive/rpc", async (req, res) => {
    res.send({ rpc: Config.hive_rpc });
  });
  app.get("/hive/rpcs/:type?", async (req, res) => {
    if ((Object.values(RpcStatusType) as unknown[]).includes(req.params.type))
      res
        .status(200)
        .send(await RpcLogic.getRPCs(req.params.type as RpcStatusType));
    else res.status(200).send(await RpcLogic.getRPCs());
  });
};

const setupApis = (app: Express) => {
  setupGetHiveRpcApi(app);
};

export const RpcApi = {
  setupApis,
};
