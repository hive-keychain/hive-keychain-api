"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountCreationEvmPriceLogic = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = require("../../config");
const getBaseUrl = () => (process.env.ACCOUNT_CREATION_EVM_LIGHT_NODE_URL ??
    config_1.Config.accountCreation.evmLightNode.baseUrl).replace(/\/$/, "");
const buildPriceUrl = (chainId, tokenAddress) => {
    const encodedChainId = encodeURIComponent(chainId);
    if (!tokenAddress)
        return `${getBaseUrl()}/price/${encodedChainId}`;
    return `${getBaseUrl()}/price/${encodedChainId}/${encodeURIComponent(tokenAddress)}`;
};
const getLatestEvmPrice = async (chainId, tokenAddress) => {
    const response = await (0, node_fetch_1.default)(buildPriceUrl(chainId, tokenAddress));
    if (response.status === 404 || response.status === 400)
        return null;
    if (!response.ok) {
        throw Object.assign(new Error("Unable to validate EVM payment token."), {
            statusCode: 502,
        });
    }
    const price = (await response.json());
    if (!Number.isFinite(price.priceUsd))
        return null;
    return {
        chainId: price.chainId ?? chainId,
        tokenAddress: price.tokenAddress ?? null,
        priceUsd: price.priceUsd.toString(),
        fetchedAt: price.fetchedAt ?? new Date().toISOString(),
    };
};
exports.AccountCreationEvmPriceLogic = {
    getLatestEvmPrice,
};
//# sourceMappingURL=account-creation-evm-price.logic.js.map