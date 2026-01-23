import { Express } from "express";
import { PriceLogic } from "../logic/price.logic";

const setupGetHivePriceApi = (app: Express) => {
  app.get("/hive/v2/price", async (req, res) => {
    res.status(200).send(PriceLogic.getHivePrices());
  });
};
const setupGetEVMPriceApi = (app: Express) => {
  app.post("/evm/v2/price", async (req, res) => {
    console.log(req.body)
    res.status(200).send(PriceLogic.getEVMPrices(req.body.coingeckoIds.filter((id:string) => id)));
  });
};

const setupApis = (app: Express) => {
  setupGetHivePriceApi(app);
  setupGetEVMPriceApi(app);
};

export const PriceApi = {
  setupApis,
};
