"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceLogic = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const node_fetch_1 = __importDefault(require("node-fetch"));
let prices;
const refreshPrices = async () => {
    logger_1.default.info("Fetching prices");
    const newPrices = await fetchPrices();
    if (newPrices) {
        prices = newPrices;
    }
};
const initFetchPrices = () => {
    logger_1.default.technical("Intializing fetch prices...");
    refreshPrices();
    setInterval(() => {
        refreshPrices();
    }, 20000);
};
const getPrices = async () => {
    return prices;
};
const fetchPrices = async () => {
    return new Promise((fulfill) => {
        (0, node_fetch_1.default)("https://api.coingecko.com/api/v3/simple/price?ids=hive%2Chive_dollar%2Cbitcoin&vs_currencies=usd&include_24hr_change=true", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => res.json())
            .then((body) => {
            if (!body.bitcoin || !body.hive || !body.hive_dollar) {
                console.log("error");
            }
            else {
                fulfill(body);
            }
        });
    });
};
exports.PriceLogic = {
    getPrices,
    fetchPrices,
    initFetchPrices,
};
//# sourceMappingURL=price.logic.js.map