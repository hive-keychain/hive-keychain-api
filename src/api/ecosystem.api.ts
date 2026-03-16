import { Express } from "express";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { EcosystemLogic } from "../logic/ecosystem/ecosystem.logic";
import { Role, accessCheck } from "../middleware/access.middleware";

const setupGetEcosystem = (app: Express) => {
  app.get(
    "/ecosystem/dapps",
    async (req, res) => {
      const ecosystemDapps = await EcosystemLogic.getDappList();
      Logger.info("Get ecosystem");
      res.status(200).send(ecosystemDapps);
    }
  );
};

const setupLegacyGetEcosystem = (app: Express) => {
  app.get(
    "/:chain/ecosystem/dapps",
    async (req, res) => {
      const ecosystemDapps = await EcosystemLogic.getDappListByChainId(
        req.params.chain,
      );
      Logger.info(`Get ${req.params.chain} ecosystem (legacy)`);
      res.status(200).send(ecosystemDapps);
    },
  );
};

const setupSaveNewDapp = (app: Express) => {
  app.post(
    "/ecosystem/new",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const newDapp = req.body;
      await EcosystemLogic.saveNewDapp(newDapp);
      Logger.info(`Saving new ${req.body?.chainId} dapp`);
      res.status(200).send({ status: 200 });
    }
  );
};

const setupLegacySaveNewDapp = (app: Express) => {
  app.post(
    "/:chain/ecosystem/new",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const newDapp = { ...req.body, chainId: req.params.chain };
      await EcosystemLogic.saveNewDapp(newDapp);
      Logger.info(`Saving new ${req.params.chain} dapp (legacy)`);
      res.status(200).send({ status: 200 });
    },
  );
};

const setupEditDapp = (app: Express) => {
  app.post(
    "/ecosystem/edit",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const dapp = req.body;
      await EcosystemLogic.editDapp(dapp);
      Logger.info(`Editing ${req.body?.chainId} dapp`);
      res.status(200).send({ status: 200 });
    }
  );
};

const setupLegacyEditDapp = (app: Express) => {
  app.post(
    "/:chain/ecosystem/edit",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const dapp = { ...req.body, chainId: req.params.chain };
      await EcosystemLogic.editDapp(dapp);
      Logger.info(`Editing ${req.params.chain} dapp (legacy)`);
      res.status(200).send({ status: 200 });
    },
  );
};

const setupDeleteDapp = (app: Express) => {
  app.post(
    "/ecosystem/delete",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const dapp = req.body;
      await EcosystemLogic.deleteDapp(dapp);
      Logger.info(`Deleting ${req.body?.chainId} dapp`);
      res.status(200).send({ status: 200 });
    }
  );
};

const setupLegacyDeleteDapp = (app: Express) => {
  app.post(
    "/:chain/ecosystem/delete",
    accessCheck(Role.TEAM),
    async (req, res) => {
      const dapp = { ...req.body, chainId: req.params.chain };
      await EcosystemLogic.deleteDapp(dapp);
      Logger.info(`Deleting ${req.params.chain} dapp (legacy)`);
      res.status(200).send({ status: 200 });
    },
  );
};

const setupApis = (app: Express) => {
  setupGetEcosystem(app);
  setupLegacyGetEcosystem(app);
  setupSaveNewDapp(app);
  setupLegacySaveNewDapp(app);
  setupEditDapp(app);
  setupLegacyEditDapp(app);
  setupDeleteDapp(app);
  setupLegacyDeleteDapp(app);
};

export const EcosystemApi = { setupApis };
