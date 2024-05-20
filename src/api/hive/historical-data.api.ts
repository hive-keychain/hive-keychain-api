import { Express } from "express";
import { HistoricalDataLogic } from "../../logic/hive/historical-data.logic";

const setupGetHistoricalDataApi = (app: Express) => {
  app.get("/hive/v2/price-history", async (req, res) => {
    res.status(200).send(await HistoricalDataLogic.get());
  });
};

const setupApis = (app: Express) => {
  setupGetHistoricalDataApi(app);
};

export const HistoricalDataApi = {
  setupApis,
};
