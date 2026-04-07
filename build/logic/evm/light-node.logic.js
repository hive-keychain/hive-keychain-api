"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmLightNodeLogic = exports.registerAddress = void 0;
const base_1 = require("../../utils/base");
const evm_chain_interfaces_1 = require("./interfaces/evm-chain.interfaces");
const getLightNodeBaseUrl = () => {
    const baseUrl = process.env.EVM_LIGHT_NODE_API_URL;
    if (!baseUrl) {
        throw new Error("Missing EVM light node base URL. Set EVM_LIGHT_NODE_URL or EVM_LIGHT_NODE_API_URL.");
    }
    return baseUrl.replace(/\/+$/, "");
};
const buildUrl = (path) => `${getLightNodeBaseUrl()}${path}`;
const getDiscoveredTokens = async (chainId, address) => {
    return await base_1.BaseApi.get(buildUrl(`/discovery/tokens/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}`));
};
const getDiscoveredNfts = async (chainId, address) => {
    return await base_1.BaseApi.get(buildUrl(`/discovery/nfts/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}`));
};
const getNftDetail = async (chainId, nftId) => {
    return base_1.BaseApi.get(buildUrl(`/nft/detail/${encodeURIComponent(chainId)}/${encodeURIComponent(nftId)}`));
};
const getHistory = async (chainId, address, cursor, limit) => {
    const query = new URLSearchParams();
    if (typeof cursor === "string" && cursor.length > 0) {
        query.set("cursor", cursor);
    }
    if (typeof limit === "number") {
        query.set("limit", String(limit));
    }
    return base_1.BaseApi.get(buildUrl(`/history/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}${query.toString() ? `?${query.toString()}` : ""}`));
};
const getHistoryDetail = async (chainId, txId) => {
    return base_1.BaseApi.get(buildUrl(`/history/detail/${encodeURIComponent(chainId)}/${encodeURIComponent(txId)}`));
};
const getContract = async (chainId, contractAddress) => {
    return base_1.BaseApi.get(buildUrl(`/contract/${encodeURIComponent(chainId)}/${encodeURIComponent(contractAddress)}`));
};
const getGasFee = async (chainId) => {
    return base_1.BaseApi.get(buildUrl(`/gas-oracle/${encodeURIComponent(chainId)}`));
};
const getPrice = async (chainId, tokenAddress) => {
    return base_1.BaseApi.get(buildUrl(`/price/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`));
};
const getNative = async (chainId) => {
    return base_1.BaseApi.get(buildUrl(`/native/${encodeURIComponent(chainId)}`));
};
const getActiveChains = async () => {
    const response = await base_1.BaseApi.get(buildUrl("/chains/active"));
    const rawChains = Array.isArray(response) ? response : [];
    const hiveChain = {
        name: "HIVE",
        type: evm_chain_interfaces_1.ChainType.HIVE,
        logo: "https://files.peakd.com/file/peakd-hive/cedricguillas/AJmv1BzrF6W3vKz8ah9GJVfnHzA9khi4QAn95cZHNsNpEnSWxoRK61yTPpQcRcX.svg",
        chainId: "beeab0de00000000000000000000000000000000000000000000000000000000",
        mainTokens: {
            hbd: "HBD",
            hive: "HIVE",
            hp: "HP",
        },
        isPopular: true,
        active: true,
    };
    const filteredChains = rawChains.filter((chain) => String(chain?.chainId) !== hiveChain.chainId);
    return [
        hiveChain,
        ...filteredChains.map((chain) => {
            return {
                name: chain.name,
                chainId: `0x${chain.chainId.toString(16)}`,
                type: evm_chain_interfaces_1.ChainType.EVM,
                logo: chain.logoUrl,
                mainToken: chain.nativeSymbol,
                defaultTransactionType: chain.eip1559
                    ? evm_chain_interfaces_1.EvmTransactionType.EIP_1559
                    : evm_chain_interfaces_1.EvmTransactionType.LEGACY,
                blockExplorer: { url: chain.explorerBaseUrl },
                testnet: chain.testnet,
                isEth: chain.chainId === 1 || chain.chainId === 11155111,
                rpcs: chain.rpcs,
                isPopular: chain.isPopular,
                openSeaChainId: chain.openSeaChainId,
                active: chain.active,
            };
        }),
    ];
};
const registerAddress = async (chainId, address, newAddress) => {
    return base_1.BaseApi.post(buildUrl(`/register/${encodeURIComponent(Number(chainId))}/${encodeURIComponent(address)}${newAddress ? "/true" : "/false"}`), {});
};
exports.registerAddress = registerAddress;
exports.EvmLightNodeLogic = {
    getDiscoveredTokens,
    getDiscoveredNfts,
    getNftDetail,
    getHistory,
    getHistoryDetail,
    getContract,
    getGasFee,
    getPrice,
    getNative,
    getActiveChains,
    registerAddress: exports.registerAddress,
};
//# sourceMappingURL=light-node.logic.js.map