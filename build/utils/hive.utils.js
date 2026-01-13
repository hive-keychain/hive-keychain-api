"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveUtils = void 0;
const dhive_1 = require("@hiveio/dhive");
let hiveClient;
const getClient = () => {
    if (!hiveClient)
        hiveClient = new dhive_1.Client(["https://api.hive.blog", "https://api.deathwing.me"], {
            consoleOnFailover: true,
            failoverThreshold: 5,
        });
    return hiveClient;
};
exports.HiveUtils = {
    getClient,
};
//# sourceMappingURL=hive.utils.js.map