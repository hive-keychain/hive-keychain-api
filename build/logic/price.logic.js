"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceLogic = void 0;
const utils_1 = require("@hiveio/dhive/lib/utils");
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const PRICES_FILE = path_1.default.join(__dirname, `../../json/coingecko-prices.json`);
let prices;
const getHivePrices = () => {
    if (!prices?.hive || !prices?.hive_dollar || !prices?.bitcoin) {
        return null;
    }
    return {
        hive: prices.hive,
        hive_dollar: prices.hive_dollar,
        bitcoin: prices.bitcoin,
    };
};
// const getEVMPrices = (coingeckoIds: string[]) => {
//   const result = {}
//   for(const id of coingeckoIds){
//     result[id] = prices[id];
//   }
//   return result;
// }
const loadCachedPrices = () => {
    try {
        prices = JSON.parse(fs_1.default.readFileSync(PRICES_FILE, "utf-8"));
    }
    catch (err) {
        logger_1.default.error("failed to load cached coingecko prices", err);
        prices = undefined;
    }
};
const initFetchPrices = () => {
    logger_1.default.technical("Intializing fetch prices...");
    loadCachedPrices();
    void runRefreshPrices();
};
const fetchPrices = async (ids) => {
    console.log("fetching prices", ids);
    const newPrices = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
        return res.json();
    })
        .then((body) => {
        if (body.status?.error_code) {
            throw new Error(body.status.error_message);
        }
        for (const key in body) {
            body[key].lastUpdateTimestamp = Date.now();
            body[key].lastUpdated = new Date().toISOString();
        }
        return body;
    })
        .catch((err) => {
        console.log("fetch coingecko error here", err.message);
        return null;
    });
    if (newPrices)
        return newPrices;
    else {
        await (0, utils_1.sleep)(2000);
        return fetchPrices(ids);
    }
};
const runRefreshPrices = async () => {
    try {
        await refreshPrices();
    }
    catch (e) {
        logger_1.default.error("failed to refresh prices", e);
        await (0, utils_1.sleep)(config_1.Config.coingecko.prices.cooldownBetweenRefresh);
        void runRefreshPrices();
    }
};
const refreshPrices = async () => {
    const start = Date.now();
    console.log("refreshing prices");
    const ids = "hive,hive_dollar,bitcoin";
    const newPrices = await fetchPrices(ids);
    if (newPrices) {
        prices = { ...prices, ...newPrices };
        fs_1.default.writeFileSync(PRICES_FILE, JSON.stringify(prices));
    }
    const end = Date.now();
    console.log(`Fetching prices took ${(end - start) / 1000}s`);
    const waitingTime = Math.max(0, config_1.Config.coingecko.prices.cooldownBetweenRefresh - (end - start));
    console.log(`Waiting for ${waitingTime / 1000}s before starting again`);
    await (0, utils_1.sleep)(waitingTime);
    void runRefreshPrices();
};
exports.PriceLogic = {
    getHivePrices,
    fetchPrices,
    initFetchPrices,
};
//# sourceMappingURL=price.logic.js.map