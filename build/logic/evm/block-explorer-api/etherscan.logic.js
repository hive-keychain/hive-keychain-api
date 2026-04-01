"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtherscanLogic = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const base_1 = require("../../../utils/base");
const chain_logic_1 = require("../../chain.logic");
const getTokenInfo = async (chainId, contractAddress) => {
    return new Promise(async (resolve, reject) => {
        resolve({
            address: contractAddress,
            result: null,
        });
        // try {
        //   const chain = defaultChainList.find((c) => c.chainId === chainId);
        //   if (!chain) {
        //     reject(new Error(`Cannot find chain with chainId ${chainId}`));
        //     return;
        //   }
        //   const res = await get(
        //     `${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(
        //       chain.chainId
        //     )}&module=token&action=getToken&contractaddress=${contractAddress}&apikey=${
        //       process.env.ETHERSCAN_API_KEY
        //     }`
        //   );
        //   if (res.status === "1") {
        //     resolve({
        //       address: contractAddress,
        //       result: { ...res.result, type: res.result.type.replace("-", "") },
        //     });
        //   } else {
        //     resolve({ address: contractAddress, result: null });
        //   }
        // } catch (err) {
        //   resolve({ address: contractAddress, result: null });
        // }
    });
};
const getEtherscanInfo = async (query) => {
    const chain = (await chain_logic_1.ChainLogic.getEvmChains()).find((c) => c.chainId === query.chain);
    if (!chain) {
        throw new Error(`Cannot find chain with chainId ${query.chain}`);
    }
    switch (query.function) {
        case "discover":
            return await discoverTokens(query.address, chain);
        case "pending-tx-list":
            return await getPendingTransactions(chain, query.address);
        case "get-abi":
            return await getAbi(chain, query.address);
        case "get-token-tx":
            return await getTokenTx(query.address, chain, query.page, query.offset);
        case "get-history":
            return await getHistory(query.address, chain, query.page, query.offset);
        case "get-internals-tx":
            return await getInternalsTx(query.address, chain, query.page, query.offset);
        case "get-nft-tx":
            return await getNftTx(query.address, chain, query.page, query.offset);
    }
};
const discoverTokens = async (walletAddress, chain) => {
    const result = await get(`${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(chain.chainId)}&module=account&action=tokenlist&address=${walletAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`);
    return result
        ? result.map((r) => ({
            ...r,
            type: r.type.replace("-", ""),
            address: r.contractAddress,
        }))
        : [];
};
const getNftTx = async (walletAddress, chain, page, offset) => {
    const erc721 = await get(`${chain.blockExplorerApi?.url}/v2/api?apikey=${process.env.ETHERSCAN_API_KEY}&chainid=${Number(chain.chainId)}&module=account&action=tokennfttx&address=${walletAddress}&page=${page}&offset=${offset}&sort=desc`);
    const erc1155 = await get(`${chain.blockExplorerApi?.url}/v2/api?apikey=${process.env.ETHERSCAN_API_KEY}&chainid=${Number(chain.chainId)}&module=account&action=token1155tx&address=${walletAddress}&page=${page}&offset=${offset}&sort=desc`);
    return [
        ...(erc721?.map((item) => ({ ...item, type: "ERC721" })) ?? []),
        ...(erc1155?.map((item) => ({ ...item, type: "ERC1155" })) ?? []),
    ];
};
const getInternalsTx = async (walletAddress, chain, page, offset) => {
    const result = await get(`${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(chain.chainId)}&module=account&action=txlistinternal&address=${walletAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}
      `);
    return result ?? [];
};
const getTokenTx = async (walletAddress, chain, page, offset) => {
    const result = await get(`${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(chain.chainId)}&module=account&action=tokentx&address=${walletAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`);
    return result?.map((item) => ({ ...item, type: "ERC20" })) ?? [];
};
const getHistory = async (walletAddress, chain, page, offset) => {
    // const result = await get(
    //   `${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(
    //     chain.chainId
    //   )}&module=account&action=txlist&address=${walletAddress}&sort=desc&page=${page}&offset=${offset}&apikey=${
    //     process.env.ETHERSCAN_API_KEY
    //   }`
    // );
    // return result ?? [];
    return [];
};
const getAbi = async (chain, address) => {
    const result = await get(`${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(chain.chainId)}&module=contract&action=getabi&address=${address}&apikey=${process.env.ETHERSCAN_API_KEY}`);
    return result;
};
const get = async (url) => {
    try {
        const res = await base_1.BaseApi.get(url);
        if (res && res.status === "1") {
            return res.result;
        }
        else {
            return null;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        return null;
    }
};
const getPendingTransactions = async (chain, address) => {
    const result = await get(`${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(chain.chainId)}&module=account&action=pendingtxlist&address=${address}&page=1&offset=50&apikey=${process.env.ETHERSCAN_API_KEY}`);
    return result;
};
exports.EtherscanLogic = {
    get,
    getAbi,
    getTokenInfo,
    getEtherscanInfo,
    getPendingTransactions,
    getHistory,
    getTokenTx,
    getInternalsTx,
    getNftTx,
    discoverTokens,
};
//# sourceMappingURL=etherscan.logic.js.map