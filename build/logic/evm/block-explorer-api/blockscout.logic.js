"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockscoutLogic = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const base_1 = require("../../../utils/base");
const chain_logic_1 = require("../../chain.logic");
const getAbi = async (chainId, address) => {
    const chain = (await chain_logic_1.ChainLogic.getEvmChains()).find((c) => c.chainId === chainId);
    if (!chain) {
        logger_1.default.error(`Cannot find chain with chainId ${chainId}`);
        return;
    }
    const res = await get(`${chain.blockExplorerApi?.url}/api?module=contract&action=getabi&address=${address}`);
    if (res.status === "1") {
        return JSON.parse(res.result);
    }
    return null;
};
const getTokenInfo = async (chainId, contractAddress) => {
    return new Promise(async (resolve, reject) => {
        try {
            const chain = (await chain_logic_1.ChainLogic.getEvmChains()).find((c) => c.chainId === chainId);
            if (!chain) {
                reject(new Error(`Cannot find chain with chainId ${chainId}`));
                return;
            }
            const res = await get(`${chain.blockExplorerApi?.url}/api/v2/addresses/${contractAddress.address}`);
            if (res && res.token) {
                const result = {
                    contractAddress: contractAddress.address,
                    chainId: chainId,
                    type: res.token.type.replace("-", ""),
                    name: res.token.name,
                    symbol: res.token.symbol,
                    logo: res.token.icon_url,
                    backgroundColor: "#FFFFFF",
                    decimals: res.token.decimals ? Number(res.token.decimals) : null,
                    possibleSpam: res.is_scam,
                    verifiedContract: res.is_verified,
                };
                resolve({
                    address: contractAddress,
                    result: result,
                });
            }
            else {
                resolve({ address: contractAddress, result: null });
            }
        }
        catch (err) {
            resolve({ address: contractAddress, result: null });
        }
    });
};
const get = async (url) => {
    return await base_1.BaseApi.get(url);
};
exports.BlockscoutLogic = {
    get,
    getAbi,
    getTokenInfo,
};
//# sourceMappingURL=blockscout.logic.js.map