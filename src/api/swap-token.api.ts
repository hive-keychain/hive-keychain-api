import { Express } from "express";
import { SwapTokenLogic } from "../logic/swaps/swap-tokens/swap-token.logic";
import { SwapsLogic } from "../logic/swaps/swaps.logic";

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

const setupGetFullLiquidityPool = (app: Express) => {
  app.get("/token-swap/liquidity-pools", (req, res) => {
    res.send(SwapTokenLogic.getLiquidityPools());
  });
};

const setupApis = (app: Express) => {
  setupGetSwapEstimation(app);
  setupGetFullLiquidityPool(app);
};

export const SwapTokenApi = { setupApis };
