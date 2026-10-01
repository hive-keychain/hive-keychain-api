import { Express, Response } from "express";
import { HistoricalDataLogic } from "../../logic/hive/historical-data.logic";

const sendChartHistory = (res: Response, asset: "hive" | "hbd") => {
  const history = HistoricalDataLogic.getChart(asset);
  if (!history) {
    res.status(503).send({ error: "Price history not available" });
    return;
  }
  res.status(200).send(history);
};

const setupGetHistoricalDataApi = (app: Express) => {
  app.get("/hive/v2/price-history", async (req, res) => {
    res.status(200).send(await HistoricalDataLogic.get());
  });

  app.get("/hive/v2/price/hive/history", async (req, res) => {
    sendChartHistory(res, "hive");
  });

  app.get("/hive/v2/price/hbd/history", async (req, res) => {
    sendChartHistory(res, "hbd");
  });
};

const setupApis = (app: Express) => {
  setupGetHistoricalDataApi(app);
};

export const HistoricalDataApi = {
  setupApis,
};
