"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalDataLogic = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const node_fetch_1 = __importDefault(require("node-fetch"));
let historicalData;
const refreshHistoricalData = async () => {
    logger_1.default.info("Fetching historical data");
    const [hive, hbd] = await Promise.all([
        fetchHistoricalData("hive"),
        fetchHistoricalData("hive_dollar"),
    ]);
    if (hive && hbd) {
        historicalData = { hive, hbd };
    }
};
const initFetchHistoricalData = () => {
    logger_1.default.technical("Intializing fetch prices...");
    refreshHistoricalData();
    setInterval(() => {
        refreshHistoricalData();
    }, 30 * 60 * 1000);
};
const getHistoricalData = async () => {
    return historicalData;
};
const fetchHistoricalData = async (currency) => {
    // return;
    return new Promise((fulfill) => {
        (0, node_fetch_1.default)(`https://api.coingecko.com/api/v3/coins/${currency}/ohlc?vs_currency=usd&days=1&precision=4`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => res.json())
            .then((body) => {
            if (body.status) {
                //do nothing
            }
            else
                fulfill(body.map((e) => e[1]));
        });
    });
};
exports.HistoricalDataLogic = {
    get: getHistoricalData,
    init: initFetchHistoricalData,
};
//# sourceMappingURL=historical-data.logic.js.map