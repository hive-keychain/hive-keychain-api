import { Express } from "express";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { EcosystemLogic } from "../logic/ecosystem/ecosystem.logic";

const setupGetEcosystem = (app: Express) => {
  app.get("/hive/ecosystem/dapps", async (req, res) => {
    const ecosystemDapps = await EcosystemLogic.getDappList("hive");
    Logger.info(`Get Hive ecosystem`);
    res.status(200).send(ecosystemDapps);
  });
};

const setupApis = (app: Express) => {
  setupGetEcosystem(app);
};

export const EcosystemApi = { setupApis };
