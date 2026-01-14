import { Express } from "express";
import { ChainLogic } from "../logic/chain.logic";

const setupGetChainsApi = (app: Express) => {
  app.get("/chains", async (req, res) => {
    const chains = await ChainLogic.getChains();
    res.status(200).send(chains);
  });
};

const setupApis = (app: Express) => {
  setupGetChainsApi(app);
};

export const ChainsApi = {
  setupApis,
};
