import { Express } from "express";
import Logger from "hive-keychain-commons/lib/logger/logger";

const setupApis = (app: Express) => {
  app.get("/hive/invoice/:op", async function (req, res) {
    try {
      Logger.debug(`Redirecting to ${req.params.op}`);
      res
        .status(302)
        .send(
          "If you see this page, you have not been redirected. Please open this link in your browser"
        )
        .redirect(`hive://sign/op/${req.params.op}`);
    } catch (e) {
      res.status(500).send(e);
    }
  });
};

export const InvoiceRedirectApi = {
  setupApis,
};
