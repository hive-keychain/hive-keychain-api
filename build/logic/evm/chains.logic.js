"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmChainsLogic = void 0;
const tokens_logic_1 = require("./tokens.logic");
const getPopularTokens = async (chainId) => {
    if (!chainId)
        return [];
    return tokens_logic_1.TokensLogic.getTokensByChainId(chainId);
};
exports.EvmChainsLogic = {
    getPopularTokens,
};
//# sourceMappingURL=chains.logic.js.map