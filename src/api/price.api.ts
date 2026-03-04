import { Express } from "express";
import { EvmLightNodeLogic } from "../logic/evm/light-node.logic";
import { PriceLogic } from "../logic/price.logic";

const setupGetHivePriceApi = (app: Express) => {
  app.get("/hive/v2/price", async (req, res) => {
    res.status(200).send(PriceLogic.getHivePrices());
  });
};

const setupGetEvmPriceApi = (app: Express) => {
  app.get("/evm/light-node/price/:chainId/:tokenAddress?", async (req, res) => {
    res
      .status(200)
      .send(
        await EvmLightNodeLogic.getPrice(
          req.params.chainId,
          req.params.tokenAddress,
        ),
      );
  });
};

const setupApis = (app: Express) => {
  setupGetHivePriceApi(app);
  setupGetEvmPriceApi(app);
};

export const PriceApi = {
  setupApis,
};
