import { Express } from "express";
import { BaseEstimate } from "./database/entities/base-estimate.entity";
import { BaseEstimateLogic } from "./logic/base-estimate.logic";
import { SwapsLogic } from "./logic/swaps.logic";

const setupGetSwapEstimation = (app: Express) => {
  app.get("/token-swap/estimate/:from/:to/:amount", async (req, res) => {
    res.send(
      await SwapsLogic.estimateSwapValue(
        req.params.from,
        req.params.to,
        parseFloat(req.params.amount)
      )
    );
  });
};

const setupSaveEstimate = (app: Express) => {
  app.post("/token-swap/estimate/save", async (req, res) => {
    return await BaseEstimateLogic.saveBaseEstimate(req.body as BaseEstimate);
  });
};

const setupApis = (app: Express) => {
  setupGetSwapEstimation(app);
  setupSaveEstimate(app);
};

export const SwapTokenApi = { setupApis };
