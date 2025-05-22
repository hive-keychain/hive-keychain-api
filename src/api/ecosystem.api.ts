import { Express } from "express";
import { query } from "express-validator";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { EcosystemLogic } from "../logic/ecosystem/ecosystem.logic";
import { Role, accessCheck } from "../middleware/access.middleware";

const setupGetEcosystem = (app: Express) => {
  app.get(
    "/:chain/ecosystem/dapps",
    query("chain").isString().not().isEmpty().escape(),
    async (req, res) => {
      const ecosystemDapps = await EcosystemLogic.getDappList(
        req.params?.chain
      );
      Logger.info(`Get ${req.params?.chain} ecosystem`);
      res.status(200).send(ecosystemDapps);
    }
  );
};

const setupSaveNewDapp = (app: Express) => {
  app.post(
    "/:chain/ecosystem/new",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const newDapp = req.body;
      await EcosystemLogic.saveNewDapp(newDapp, req.params.chain);
      Logger.info(`Saving new ${req.params.chain} dapp`);
      res.status(200).send({ status: 200 });
    }
  );
};

const setupEditDapp = (app: Express) => {
  app.post(
    "/:chain/ecosystem/edit",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const dapp = req.body;
      console.log("req.body", req.body);
      await EcosystemLogic.editDapp(dapp, req.params.chain);
      Logger.info(`Editing ${req.params.chain} dapp`);
      res.status(200).send({ status: 200 });
    }
  );
};

const setupDeleteDapp = (app: Express) => {
  app.post(
    "/:chain/ecosystem/delete",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const dapp = req.body;
      console.log("req.body", req.body);
      await EcosystemLogic.deleteDapp(dapp, req.params.chain);
      Logger.info(`Deleting ${req.params.chain} dapp`);
      res.status(200).send({ status: 200 });
    }
  );
};

const setupApis = (app: Express) => {
  setupGetEcosystem(app);
  setupSaveNewDapp(app);
  setupEditDapp(app);
  setupDeleteDapp(app);
};

export const EcosystemApi = { setupApis };
