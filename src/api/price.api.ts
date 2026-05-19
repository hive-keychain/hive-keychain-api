import { Express } from "express";
import { PriceLogic } from "../logic/price.logic";

const setupGetHivePriceApi = (app: Express) => {
  app.get("/hive/v2/price", async (req, res) => {
    const prices = PriceLogic.getHivePrices();
    if (!prices) {
      res.status(503).send({ error: "Prices not available" });
      return;
    }
    res.status(200).send(prices);
  });
};

const setupApis = (app: Express) => {
  setupGetHivePriceApi(app);
};

export const PriceApi = {
  setupApis,
};
