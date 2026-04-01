"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoingeckoUtils = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const request_1 = __importDefault(require("request"));
const fetchCoingeckoTokensConfig = () => {
    return new Promise((fulfill) => {
        (0, request_1.default)({
            url: `https://api.coingecko.com/api/v3/coins/list?include_platform=true`,
            json: true,
            headers: {
                "User-Agent": "Hive Keychain/1.0",
            },
        }, (err, http, body) => {
            if (err) {
                fulfill(null);
            }
            else {
                if (body?.status?.error_code)
                    fulfill(null);
                else
                    fulfill(body);
            }
        });
    });
};
const fetchCoingeckoPlatformsConfig = () => {
    return new Promise((fulfill) => {
        (0, request_1.default)({
            url: `https://api.coingecko.com/api/v3/asset_platforms`,
            json: true,
            headers: {
                "User-Agent": "Hive Keychain/1.0",
            },
        }, (err, http, body) => {
            if (err) {
                fulfill(null);
            }
            else {
                if (body?.status?.error_code)
                    fulfill(null);
                else
                    fulfill(body);
            }
        });
    });
};
const fetchCoingeckoCoinData = (id) => {
    return new Promise((fulfill) => {
        (0, request_1.default)({
            url: `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
            json: true,
            headers: {
                "User-Agent": "Hive Keychain/1.0",
            },
        }, (err, http, body) => {
            if (err) {
                fulfill(null);
            }
            else {
                if (body?.status?.error_code) {
                    logger_1.default.error("hello", body.status.error_message);
                    fulfill(null);
                }
                else
                    fulfill(body);
            }
        });
    });
};
exports.CoingeckoUtils = {
    fetchCoingeckoPlatformsConfig,
    fetchCoingeckoTokensConfig,
    fetchCoingeckoCoinData,
};
//# sourceMappingURL=coingecko.utils.js.map