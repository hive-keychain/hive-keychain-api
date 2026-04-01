"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoingeckoConfigLogic = void 0;
const fs = __importStar(require("fs"));
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const coingecko_utils_1 = require("../../utils/coingecko.utils");
const evm_smart_contracts_interface_1 = require("./interfaces/evm-smart-contracts.interface");
const initFetchCoingeckoConfig = () => {
    fetchCoingeckoFullConfig();
    setInterval(() => {
        fetchCoingeckoFullConfig();
    }, 3600 * 1000);
};
const fetchCoingeckoFullConfig = async () => {
    const [tokens, platforms] = await Promise.all([
        coingecko_utils_1.CoingeckoUtils.fetchCoingeckoTokensConfig(),
        coingecko_utils_1.CoingeckoUtils.fetchCoingeckoPlatformsConfig(),
    ]);
    const fullConfig = await getCoingeckoConfigFile();
    if (tokens) {
        fullConfig.tokens = tokens;
    }
    else {
        logger_1.default.error("Failed to update coingecko tokens");
    }
    if (platforms) {
        fullConfig.platforms = platforms.map((e) => ({
            ...e,
            chain_id: e.chain_identifier
                ? "0x" + e.chain_identifier.toString(16)
                : undefined,
        }));
    }
    else {
        logger_1.default.error("Failed to update coingecko platforms");
    }
    saveCoingeckoConfigFile(fullConfig);
};
const addCoingeckoIdToTokenInfo = async (chainId, tokens) => {
    try {
        const coingeckoConfig = await getCoingeckoConfigFile();
        const chain = coingeckoConfig.platforms.find((e) => Number(e.chain_identifier) === Number(chainId));
        if (!chain)
            return tokens;
        return tokens.map((token) => {
            if (token.type === evm_smart_contracts_interface_1.EVMSmartContractType.NATIVE)
                return token;
            const tokenInfo = coingeckoConfig.tokens.find((e) => e.platforms[chain.id] === token.contractAddress);
            if (tokenInfo)
                token.coingeckoId = tokenInfo.id;
            return token;
        });
    }
    catch (e) {
        logger_1.default.error("Error while getting coingeckoId", e);
        return tokens;
    }
};
const getCoingeckoConfigFile = async () => {
    try {
        return JSON.parse(await fs
            .readFileSync(__dirname + `/../../../json/coingeckoConfig.json`)
            .toString());
    }
    catch (e) {
        return { platforms: [], tokens: [] };
    }
};
const saveCoingeckoConfigFile = async (newList) => {
    try {
        await fs.writeFile(__dirname + `/../../../json/coingeckoConfig.json`, JSON.stringify(newList), "utf8", () => logger_1.default.info(`Updated coingecko config file`));
    }
    catch (e) {
        logger_1.default.info("Failed to update coingecko config file");
    }
};
const getCoingeckoId = async (chainId) => {
    const platform = (await getCoingeckoConfigFile()).platforms.find((p) => Number(p.chain_identifier) === Number(chainId));
    return platform ? platform.native_coin_id : "";
};
exports.CoingeckoConfigLogic = {
    initFetchCoingeckoConfig,
    addCoingeckoIdToTokenInfo,
    getCoingeckoId,
    getCoingeckoConfigFile,
};
//# sourceMappingURL=coingecko-config.js.map