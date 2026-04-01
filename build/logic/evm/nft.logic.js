"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftLogic = void 0;
const base_1 = require("../../utils/base");
const getOpenSeaMetadata = async (contractAddress, chain, tokenId) => {
    const res = await base_1.BaseApi.get(`https://api.opensea.io/api/v2/chain/${chain.openSeaChainId}/contract/${contractAddress}/nfts/${tokenId}`, {
        headers: {
            "X-API-KEY": process.env.OPENSEA_API_KEY,
        },
    });
    return res;
};
exports.NftLogic = { getOpenSeaMetadata };
//# sourceMappingURL=nft.logic.js.map