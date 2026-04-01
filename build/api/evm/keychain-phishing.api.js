"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeychainPhishingApi = void 0;
const keychain_phishing_logic_1 = require("../../logic/evm/verify-transaction/phishing-list/keychain-phishing.logic");
const setupGetKeychainPhishingApi = (app) => {
    app.get("/evm/keychain-phishing-list", async (req, res) => {
        const phishingList = await keychain_phishing_logic_1.KeychainPhishingLogic.getPhishingList();
        res.status(200).send(phishingList);
    });
};
const setupSaveKeychainPhishingApi = (app) => {
    app.post("/evm/keychain-phishing-list", async (req, res) => {
        await keychain_phishing_logic_1.KeychainPhishingLogic.setLists(req.body);
        res.status(200).send({ status: 200, message: "Successfully saved" });
    });
};
const setupApis = (app) => {
    setupGetKeychainPhishingApi(app);
    setupSaveKeychainPhishingApi(app);
};
exports.KeychainPhishingApi = { setupApis };
//# sourceMappingURL=keychain-phishing.api.js.map