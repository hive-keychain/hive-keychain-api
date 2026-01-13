"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTokens = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const getAllTokens = async () => {
    try {
        let tokens = [];
        let offset = 0;
        do {
            const newTokens = await getTokens(offset);
            tokens.push(...newTokens);
            offset += 1000;
        } while (tokens.length % 1000 === 0);
        return tokens;
    }
    catch (e) {
        logger_1.default.error("failed fetching colors");
    }
};
exports.getAllTokens = getAllTokens;
const getTokens = async (offset) => {
    return (await get({
        contract: "tokens",
        table: "tokens",
        query: {},
        limit: 1000,
        offset: offset,
        indexes: [],
    })).map((t) => {
        return {
            ...t,
            metadata: JSON.parse(t.metadata),
        };
    });
};
const get = async (params, timeout = 10) => {
    const url = `https://api.hive-engine.com/rpc/contracts`;
    return new Promise((resolve, reject) => {
        let resolved = false;
        (0, node_fetch_1.default)(url, {
            method: "POST",
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "find",
                params,
                id: 1,
            }),
            headers: { "Content-Type": "application/json" },
        })
            .then((res) => {
            if (res && res.status === 200) {
                resolved = true;
                return res.json();
            }
        })
            .then((res) => {
            if (res)
                resolve(res.result);
            else
                reject("failed");
        });
        setTimeout(() => {
            if (!resolved) {
                reject("html_popup_tokens_timeout");
            }
        }, timeout * 1000);
    });
};
//# sourceMappingURL=hive-engine.utils.js.map