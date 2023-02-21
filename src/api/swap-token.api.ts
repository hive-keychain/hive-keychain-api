import { Express } from "express";
import { SwapTokenLogic } from "../logic/swaps/swap-token.logic";

const setupGetSwapEstimation = (app: Express) => {
  app.get("/token-swap/estimate/:from/:to/:amount", async (req, res) => {
    res.send(
      await SwapTokenLogic.estimateSwapValue(
        req.params.from,
        req.params.to,
        parseFloat(req.params.amount)
      )
    );
  });
};

const setupGetFullMarketPool = (app: Express) => {
  app.get("/token-swap/market-pools", (req, res) => {
    res.send(SwapTokenLogic.getMarketPools());
  });
};

const setupApis = (app: Express) => {
  setupGetSwapEstimation(app);
  setupGetFullMarketPool(app);
};

export const SwapTokenApi = { setupApis };
