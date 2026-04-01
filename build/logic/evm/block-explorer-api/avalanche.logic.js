"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvalancheLogic = void 0;
const base_1 = require("../../../utils/base");
const chain_logic_1 = require("../../chain.logic");
const getTokenInfo = async (chainId, contractAddress) => {
    return new Promise(async (resolve, reject) => {
        try {
            const chain = (await chain_logic_1.ChainLogic.getEvmChains()).find((c) => c.chainId === chainId);
            if (!chain) {
                reject(new Error(`Cannot find chain with chainId ${chainId}`));
                return;
            }
            const res = await get(`${chain.blockExplorerApi?.url}/v1/chains/${Number(chain.chainId)}/addresses/${contractAddress.address}`);
            if (!res || res.error) {
                resolve({ address: contractAddress, result: null });
            }
            else {
                resolve({
                    address: contractAddress,
                    result: {
                        type: res.ercType.replace("-", ""),
                        contractAddress: contractAddress.address,
                        name: res.name,
                        symbol: res.symbol,
                        logo: res.logoAsset?.imageUri || null,
                        decimals: res.decimals,
                        chainId: chain.chainId,
                        category: null,
                        backgroundColor: res.color,
                        links: {
                            project_url: null,
                            wiki_url: null,
                            discord_url: null,
                            telegram_url: null,
                            twitter_username: null,
                            instagram_username: null,
                        },
                    },
                });
            }
        }
        catch (err) {
            console.log(err);
            resolve({ address: contractAddress, result: null });
        }
    });
};
const get = async (url) => {
    return await base_1.BaseApi.get(url);
};
exports.AvalancheLogic = { getTokenInfo };
//# sourceMappingURL=avalanche.logic.js.map