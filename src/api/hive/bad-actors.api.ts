import { Express } from "express";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { BadActorsLogic } from "../../logic/hive/bad-actors.logic";

const setupGetPhishingAccount = (app: Express) => {
  app.get("/hive/phishingAccounts", async (req, res) => {
    const phishingAccounts = await BadActorsLogic.getPhishingAccounts();
    Logger.info(
      `${phishingAccounts.length} potential phishing accounts listed.`
    );
    res.status(200).send(phishingAccounts);
  });
};

const setupGetBlacklistedDomains = (app: Express) => {
  app.get("/hive/blacklistedDomains", async (req, res) => {
    const blacklistedDomains = await BadActorsLogic.getBlacklistedDomains();
    Logger.info(`${blacklistedDomains.length} blacklisted domains listed.`);
    res.status(200).send(blacklistedDomains);
  });
};

const setupApis = (app: Express) => {
  setupGetPhishingAccount(app);
  setupGetBlacklistedDomains(app);
};

export const BadActorsApi = { setupApis };
