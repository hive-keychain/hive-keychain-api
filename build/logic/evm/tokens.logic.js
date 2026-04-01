"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensLogic = void 0;
const coingecko_config_1 = require("./coingecko-config");
const getTokensByChainId = async (chainId) => {
    const chainCoingeckoId = await coingecko_config_1.CoingeckoConfigLogic.getCoingeckoId(chainId);
    const allTokens = await coingecko_config_1.CoingeckoConfigLogic.getCoingeckoConfigFile();
    const bscTokens = allTokens.tokens.filter((token) => !!token.platforms[chainCoingeckoId]);
    return bscTokens.map((token) => {
        return {
            name: token.name,
            symbol: token.symbol,
            contractAddress: token.platforms[chainCoingeckoId],
            logo: "https://picsum.photos/200/200",
        };
    });
};
exports.TokensLogic = {
    getTokensByChainId,
};
//# sourceMappingURL=tokens.logic.js.map