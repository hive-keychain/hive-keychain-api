import { Express } from "express";
import { BadActorsLogic } from "../logic/bad-actors.logic";

const setupGetPhishingAccount = (app: Express) => {
  app.get("/hive/phishingAccounts", async (req, res) => {
    const phishingAccounts = await BadActorsLogic.getPhishingAccounts();
    console.log(
      `${phishingAccounts.length} potential phishing accounts listed.`
    );
    res.status(200).send(phishingAccounts);
  });
};

const setupApis = (app: Express) => {
  setupGetPhishingAccount(app);
};

export const BadActorsApi = { setupApis };
