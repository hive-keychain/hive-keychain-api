import { Express } from "express";
import { GasPriceEstimateLogic } from "../../logic/evm/gas-price-estimate.logic";

const setupGasPriceEstimate = (app: Express) => {
  app.get("/evm/gasPriceEstimate/:chainId", async (req, res) => {
    const gasPriceEstimate = await GasPriceEstimateLogic.getGasPriceEstimate(
      req.params.chainId
    );
    res.status(200).send(gasPriceEstimate);
  });
};

const setupApis = (app: Express) => {
  setupGasPriceEstimate(app);
};

export const GasPriceEstimateApi = { setupApis };
