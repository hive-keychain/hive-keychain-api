import { Express } from "express";
import { DelegationLogic } from "../logic/delegation.logic";

const setupGetIncomingDelegations = (app: Express) => {
  app.get("/hive/delegators/:username", async function (req, res) {
    try {
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
