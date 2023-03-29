import { Express } from "express";
import { PriceLogic } from "../prices/price.logic";

const setupGetPriceApi = (app: Express) => {
  app.get("/hive/v2/price", async (req, res) => {
    res.status(200).send(await PriceLogic.getPrices());
  });
};

const setupApis = (app: Express) => {
  setupGetPriceApi(app);
};

export const PriceApi = {
  setupApis,
};
