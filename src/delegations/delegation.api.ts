import { Express } from "express";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { DelegationLogic } from "../delegations/delegation.logic";

const setupGetIncomingDelegations = (app: Express) => {
  app.get("/hive/delegators/:username", async function (req, res) {
    try {
      Logger.debug(`Getting delegators for ${req.params.username}`);
      const resp = await DelegationLogic.getIncoming(req.params.username);
      res.status(200).send(resp);
    } catch (e) {
      res.status(500).send(e);
    }
  });
};

const setupApis = (app: Express) => {
  setupGetIncomingDelegations(app);
};

export const DelegationApi = { setupApis };
