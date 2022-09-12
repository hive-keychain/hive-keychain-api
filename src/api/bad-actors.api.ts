import { Express } from "express";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { BadActorsLogic } from "../logic/bad-actors.logic";

const setupGetPhishingAccount = (app: Express) => {
  app.get("/hive/phishingAccounts", async (req, res) => {
    const phishingAccounts = await BadActorsLogic.getPhishingAccounts();
    Logger.info(
      `${phishingAccounts.length} potential phishing accounts listed.`
    );
    res.status(200).send(phishingAccounts);
  });
};

const setupApis = (app: Express) => {
  setupGetPhishingAccount(app);
};

export const BadActorsApi = { setupApis };
