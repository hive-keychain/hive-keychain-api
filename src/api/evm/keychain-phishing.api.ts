import { Express } from "express";
import { KeychainPhishingLogic } from "../../logic/evm/verify-transaction/phishing-list/keychain-phishing.logic";

const setupGetKeychainPhishingApi = (app: Express) => {
  app.get("/evm/keychain-phishing-list", async (req, res) => {
    const phishingList = await KeychainPhishingLogic.getPhishingList();
    res.status(200).send(phishingList);
  });
};

const setupSaveKeychainPhishingApi = (app: Express) => {
  app.post("/evm/keychain-phishing-list", async (req, res) => {
    await KeychainPhishingLogic.setLists(req.body);
    res.status(200).send({ status: 200, message: "Successfully saved" });
  });
};

const setupApis = (app: Express) => {
  setupGetKeychainPhishingApi(app);
  setupSaveKeychainPhishingApi(app);
};

export const KeychainPhishingApi = { setupApis };
