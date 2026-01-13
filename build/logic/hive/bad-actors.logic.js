"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadActorsLogic = void 0;
const dhive_1 = require("@hiveio/dhive");
const phishing = require("@hiveio/hivescript/bad-actors.json");
const getPhishingAccounts = async () => {
    return phishing;
};
const getBlacklistedDomains = async () => {
    const client = new dhive_1.Client([
        "https://api.hive.blog",
        "https://api.deathwing.me",
    ]);
    const res = await client.call("bridge", "get_post", {
        author: "keys-defender",
        permlink: "phishing-db",
    });
    return JSON.parse(res.body);
};
exports.BadActorsLogic = {
    getPhishingAccounts,
    getBlacklistedDomains,
};
//# sourceMappingURL=bad-actors.logic.js.map