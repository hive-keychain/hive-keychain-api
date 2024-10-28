import { Express } from "express";
import Logger from "hive-keychain-commons/lib/logger/logger";

const setupApis = (app: Express) => {
  app.get("/hive/invoice/:op", async function (req, res) {
    try {
      Logger.debug(`Redirecting to ${req.params.op}`);
      res
        .status(302)

        .redirect(`hive://sign/op/${req.params.op}`);
    } catch (e) {
      console.log("here");
      res.status(500).send(e);
    }
  });
};

export const InvoiceRedirectApi = {
  setupApis,
};
