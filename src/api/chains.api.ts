import { Express } from "express";
import { EvmLightNodeLogic } from "../logic/evm/light-node.logic";

const setupGetChainsApi = (app: Express) => {
  app.get("/chains", async (req, res) => {
    // const chains = await ChainLogic.getChains();
    const chains = await EvmLightNodeLogic.getActiveChains();
    res.status(200).send(chains);
  });
};

const setupApis = (app: Express) => {
  setupGetChainsApi(app);
};

export const ChainsApi = {
  setupApis,
};
