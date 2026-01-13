"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadActorsApi = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const bad_actors_logic_1 = require("../../logic/hive/bad-actors.logic");
const setupGetPhishingAccount = (app) => {
    app.get("/hive/phishingAccounts", async (req, res) => {
        const phishingAccounts = await bad_actors_logic_1.BadActorsLogic.getPhishingAccounts();
        logger_1.default.info(`${phishingAccounts.length} potential phishing accounts listed.`);
        res.status(200).send(phishingAccounts);
    });
};
const setupGetBlacklistedDomains = (app) => {
    app.get("/hive/blacklistedDomains", async (req, res) => {
        const blacklistedDomains = await bad_actors_logic_1.BadActorsLogic.getBlacklistedDomains();
        logger_1.default.info(`${blacklistedDomains.length} blacklisted domains listed.`);
        res.status(200).send(blacklistedDomains);
    });
};
const setupApis = (app) => {
    setupGetPhishingAccount(app);
    setupGetBlacklistedDomains(app);
};
exports.BadActorsApi = { setupApis };
//# sourceMappingURL=bad-actors.api.js.map