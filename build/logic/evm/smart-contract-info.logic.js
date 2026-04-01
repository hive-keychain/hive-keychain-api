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
exports.SmartContractsInfoLogic = void 0;
const fs = __importStar(require("fs"));
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const moralis_1 = __importDefault(require("moralis"));
const array_utils_1 = require("../../utils/array.utils");
const coingecko_utils_1 = require("../../utils/coingecko.utils");
const chain_logic_1 = require("../chain.logic");
const token_background_color_1 = require("../hive/token-background-color");
const avalanche_logic_1 = require("./block-explorer-api/avalanche.logic");
const blockscout_logic_1 = require("./block-explorer-api/blockscout.logic");
const etherscan_logic_1 = require("./block-explorer-api/etherscan.logic");
const coingecko_config_1 = require("./coingecko-config");
const smart_contract_mapping_1 = require("./data/smart-contract-mapping");
const evm_chain_interfaces_1 = require("./interfaces/evm-chain.interfaces");
const evm_smart_contracts_interface_1 = require("./interfaces/evm-smart-contracts.interface");
let isMoralisInitialized = false;
const initMoralisIfNeeded = async () => {
    if (!isMoralisInitialized) {
        await moralis_1.default.start({
            apiKey: process.env.MORALIS_API_KEY,
        });
        isMoralisInitialized = true;
    }
};
const refreshNullTokens = async () => {
    // await initMoralisIfNeeded();
    const savedSmartContractList = await getCurrentSmartContractList();
    const chainIds = [...new Set(savedSmartContractList.map((sc) => sc.chainId))];
    for (const chain of chainIds) {
        const smartContractsToFetch = savedSmartContractList
            .filter((smartContract) => smartContract.contractAddress &&
            smartContract.chainId === chain &&
            !smartContract.type)
            .map((smartContract) => ({
            address: smartContract.contractAddress,
            tokenId: smartContract.tokenId,
        }));
        const newSmartContractsFromMoralis = await getFromMoralis(chain, smartContractsToFetch);
        // replace in the original list using find index
        for (const newSmartContract of newSmartContractsFromMoralis) {
            const index = savedSmartContractList.findIndex((sc) => sc.contractAddress === newSmartContract.contractAddress &&
                sc.chainId === newSmartContract.chainId);
            savedSmartContractList[index] = newSmartContract;
        }
    }
    saveNewSmartContractsList(savedSmartContractList);
};
const getSmartContractInfo = async (chain, smartContractAddresses) => {
    const savedSmartContractList = await getCurrentSmartContractList();
    const existingSmartContractsFromList = [];
    const smartContractsAddressesToFetch = [];
    for (const smartContractAddress of smartContractAddresses) {
        const savedSmartContract = savedSmartContractList.find((sc) => sc.chainId === chain &&
            smartContractAddress.address === sc.contractAddress);
        if (savedSmartContract) {
            existingSmartContractsFromList.push(savedSmartContract);
        }
        else {
            smartContractsAddressesToFetch.push(smartContractAddress);
        }
    }
    const newSmartContractsFromMoralis = await getFromMoralis(chain, smartContractsAddressesToFetch);
    const savedNativeToken = savedSmartContractList.find((token) => token.chainId === chain && token.type === evm_smart_contracts_interface_1.EVMSmartContractType.NATIVE);
    const newNativeToken = savedNativeToken
        ? null
        : await getNativeTokenFromCoingecko(chain);
    let newNativeTokens = newNativeToken ? [newNativeToken] : [];
    const smartContracts = [
        ...newNativeTokens,
        ...savedSmartContractList,
        ...newSmartContractsFromMoralis,
    ];
    // const nativeToken = newNativeToken || savedNativeToken;
    // if (nativeToken) {
    //   smartContracts.push(nativeToken);
    // }
    const smartContractsWithCGInfo = await coingecko_config_1.CoingeckoConfigLogic.addCoingeckoIdToTokenInfo(chain, smartContracts.filter((info) => !!info.type));
    for (const smartContract of smartContractsWithCGInfo) {
        if (smartContract.type !== evm_smart_contracts_interface_1.EVMSmartContractType.NATIVE) {
            smartContract.name =
                (0, smart_contract_mapping_1.getSmartContractMappingValue)(smartContract.contractAddress, chain) ??
                    smartContract.name;
        }
    }
    saveNewSmartContractsList(smartContracts);
    return smartContractsWithCGInfo.filter((e) => {
        if (e.chainId === chain) {
            if (e.type === evm_smart_contracts_interface_1.EVMSmartContractType.NATIVE) {
                return true;
            }
            else if (smartContractAddresses
                .map((address) => address.address)
                .includes(e.contractAddress)) {
                return true;
            }
        }
        return false;
    });
};
const getNativeTokenFromCoingecko = async (chainId) => {
    console.log("getting from coingecko");
    let coingeckoPlatform;
    try {
        const coingeckoConfig = await coingecko_config_1.CoingeckoConfigLogic.getCoingeckoConfigFile();
        console.log("chainId", chainId);
        coingeckoPlatform = coingeckoConfig.platforms.find((e) => Number(e.chain_id) === Number(chainId));
        console.log("chain", coingeckoPlatform);
        const nativeTokenId = coingeckoPlatform?.native_coin_id;
        if (nativeTokenId) {
            const nativeToken = await coingecko_utils_1.CoingeckoUtils.fetchCoingeckoCoinData(nativeTokenId);
            return {
                type: evm_smart_contracts_interface_1.EVMSmartContractType.NATIVE,
                createdAt: nativeToken.genesis_date,
                categories: nativeToken.categories,
                // links: nativeToken.links,
                name: nativeToken.name,
                logo: nativeToken.image.large,
                backgroundColor: await token_background_color_1.TokensBackgroundColorsLogic.getBackgroundColorFromImage(nativeToken.image.large),
                symbol: nativeToken.symbol,
                chainId,
                coingeckoId: nativeTokenId,
            };
        }
    }
    catch (err) {
        console.log(err);
        const chainInfo = (await chain_logic_1.ChainLogic.getEvmChains()).find((c) => c.chainId === chainId);
        if (coingeckoPlatform) {
            return {
                type: evm_smart_contracts_interface_1.EVMSmartContractType.NATIVE,
                createdAt: "",
                categories: [],
                name: coingeckoPlatform.name,
                logo: coingeckoPlatform.image.large,
                backgroundColor: await token_background_color_1.TokensBackgroundColorsLogic.getBackgroundColorFromImage(coingeckoPlatform.image.large),
                symbol: chainInfo?.mainToken,
                coingeckoId: coingeckoPlatform.native_coin_id,
                chainId: chainId,
            };
        }
    }
    return null;
};
const getFromMoralis = async (chainId, smartContractAddresses) => {
    console.log("getting from moralis", smartContractAddresses);
    let start = Date.now();
    const tokenAddresses = [];
    const nftAddresses = [];
    const otherTokensAddresses = [];
    const otherTokens = [];
    const tokens = [];
    const nfts = [];
    const infoPromises = [];
    const chain = (await chain_logic_1.ChainLogic.getChains()).find((c) => c.chainId === chainId);
    if (!chainId)
        return [];
    for (const smartContractAddress of smartContractAddresses) {
        switch (chain?.blockExplorerApi?.type) {
            case evm_chain_interfaces_1.BlockExplorerType.BLOCKSCOUT:
                infoPromises.push(blockscout_logic_1.BlockscoutLogic.getTokenInfo(chainId, smartContractAddress));
                break;
            case evm_chain_interfaces_1.BlockExplorerType.AVALANCHE_SCAN:
                console.log("Avalanche scan getting", smartContractAddress);
                infoPromises.push(avalanche_logic_1.AvalancheLogic.getTokenInfo(chainId, smartContractAddress));
                break;
            case evm_chain_interfaces_1.BlockExplorerType.ETHERSCAN:
                infoPromises.push(etherscan_logic_1.EtherscanLogic.getTokenInfo(chainId, smartContractAddress));
                break;
            default: {
                console.log("No block explorer api type found for chain", chainId);
            }
        }
    }
    const infoResults = await Promise.all(infoPromises);
    console.log(JSON.stringify(infoResults));
    console.log("Scan took", (Date.now() - start) / 1000);
    for (const infoResult of infoResults) {
        const info = infoResult.result;
        console.log(infoResult);
        if (info) {
            switch (info.type) {
                case "ERC20":
                    tokenAddresses.push({ address: infoResult.address });
                    tokens.push(infoResult.result);
                    break;
                case "ERC721":
                case "ERC1155":
                    nftAddresses.push({ address: infoResult.address });
                    nfts.push(infoResult.result);
                    break;
                case null: {
                    tokenAddresses.push(infoResult.address);
                    nftAddresses.push(infoResult.address);
                }
            }
        }
        else {
            console.log(infoResult, "ici");
            otherTokensAddresses.push({ address: infoResult.address });
            otherTokens.push({
                contractAddress: infoResult.address,
                chainId: chainId,
            });
        }
    }
    let startMoralis = Date.now();
    const [tokensFromMoralis, nftsFromMoralis] = await Promise.all([
        getTokensFromMoralis(chainId, [...tokenAddresses, ...otherTokensAddresses]),
        getNftsFromMoralis(chainId, nftAddresses),
    ]);
    console.log("moralis took", (Date.now() - startMoralis) / 1000);
    console.log("total moralis function took", (Date.now() - start) / 1000);
    // console.log({ tokensFromMoralis, nftsFromMoralis });
    return [
        ...(tokensFromMoralis && tokensFromMoralis.length > 0
            ? tokensFromMoralis
            : tokens),
        ...(nftsFromMoralis && nftsFromMoralis.length > 0 ? nftsFromMoralis : nfts),
        ...otherTokens,
    ];
};
const getNftsFromMoralis = async (chain, contractsAddresses) => {
    try {
        console.log({ getNftsFromMoralis: contractsAddresses });
        if (!contractsAddresses.length)
            return [];
        logger_1.default.info(`Getting nfts ${contractsAddresses
            .map((ca) => ca.address)
            .join(",")} from Moralis for chain ${chain}`);
        // await initMoralisIfNeeded();
        await moralis_1.default.EvmApi.nft.getNFTContractMetadata({
            address: contractsAddresses[0].address,
            chain,
        });
        contractsAddresses = contractsAddresses.filter((ca) => ca.tokenId);
        console.log(array_utils_1.ArrayUtils.splitArray(contractsAddresses, 25));
        const splitedContractsAddresses = array_utils_1.ArrayUtils.splitArray(contractsAddresses, 25);
        let result = [];
        for (const subList of splitedContractsAddresses) {
            result = [
                ...result,
                ...(await moralis_1.default.EvmApi.nft.getMultipleNFTs({
                    tokens: subList.map((contractAddress) => ({
                        tokenAddress: contractAddress.address,
                        tokenId: contractAddress.tokenId,
                    })),
                    chain,
                })).toJSON(),
            ];
        }
        // const promises = ArrayUtils.splitArray(contractsAddresses, 25).map(
        //   async (subList) => {
        //     return Moralis.EvmApi.nft.getMultipleNFTs({
        //       tokens: subList.map((contractAddress) => ({
        //         tokenAddress: contractAddress.address,
        //         tokenId: contractAddress.tokenId!,
        //       })),
        //       chain,
        //     });
        //   }
        // );
        // const result = await Promise.all(promises);
        // console.log(result);
        // const resultFlag = result.flat();
        // console.log(resultFlag);
        return (await Promise.all(result.map(async (moralisNftMetadata) => {
            // console.log({ moralisNftMetadata });
            if (!moralisNftMetadata)
                return null;
            const metadata = moralisNftMetadata?.metadata
                ? JSON.parse(moralisNftMetadata.metadata)
                : null;
            let backgroundColor;
            if (metadata)
                await token_background_color_1.TokensBackgroundColorsLogic.getBackgroundColorFromImage(metadata.image);
            return {
                type: moralisNftMetadata?.contract_type,
                contractAddress: moralisNftMetadata.token_address,
                name: moralisNftMetadata.name,
                symbol: moralisNftMetadata.symbol,
                logo: moralisNftMetadata.collection_logo,
                possibleSpam: moralisNftMetadata.possible_spam,
                verifiedContract: moralisNftMetadata.verified_collection,
                chainId: chain,
                category: moralisNftMetadata.collection_category,
                backgroundColor: backgroundColor,
            };
        })));
    }
    catch (e) {
        logger_1.default.error("Moralis fetch error", e);
        return null;
    }
};
const getTokensFromMoralis = async (chain, addresses) => {
    try {
        console.log(addresses);
        if (!addresses.length) {
            console.log("No addresses to get tokens from Moralis");
            return [];
        }
        logger_1.default.info(`Getting tokens ${addresses
            .map((a) => a.address)
            .join(",")} from Moralis for chain ${chain}`);
        // await initMoralisIfNeeded();
        console.log(addresses.map((address) => address.address));
        const moralisTokensMetadata = (await moralis_1.default.EvmApi.token.getTokenMetadata({
            addresses: addresses.map((address) => address.address),
            chain,
        })).toJSON();
        //@ts-ignore
        return Promise.all(moralisTokensMetadata.map(async (moralisTokenMD) => {
            const backgroundColor = await token_background_color_1.TokensBackgroundColorsLogic.getBackgroundColorFromImage(moralisTokenMD.logo);
            return {
                type: evm_smart_contracts_interface_1.EVMSmartContractType.ERC20,
                contractAddress: moralisTokenMD.address,
                name: moralisTokenMD.name,
                symbol: moralisTokenMD.symbol,
                decimals: +moralisTokenMD.decimals,
                logo: moralisTokenMD.logo,
                blockNumber: +(moralisTokenMD.block_number ?? -1),
                validated: moralisTokenMD.validated,
                createdAt: moralisTokenMD.created_at,
                possibleSpam: moralisTokenMD.possible_spam,
                verifiedContract: moralisTokenMD.verified_contract,
                chainId: chain,
                // categories: moralisTokenMD.categories,
                // links: moralisTokenMD.links,
                backgroundColor: backgroundColor,
            };
        }));
    }
    catch (e) {
        logger_1.default.error("Moralis fetch error", e);
        return null;
    }
};
const getCurrentSmartContractList = async () => {
    try {
        return JSON.parse(await fs
            .readFileSync(__dirname + `/../../../json/evm-smart-contracts.json`)
            .toString());
    }
    catch (e) {
        return [];
    }
};
const saveNewSmartContractsList = (newList) => {
    try {
        fs.writeFileSync(__dirname + `/../../../json/evm-smart-contracts.json`, JSON.stringify(newList), "utf8");
        logger_1.default.info(`Updated evm smart contracts list`);
    }
    catch (e) {
        logger_1.default.info("Failed to update evm smart contracts list");
        console.log(e);
    }
};
exports.SmartContractsInfoLogic = {
    getSmartContractInfo,
    refreshNullTokens,
    getCurrentSmartContractList,
    saveNewSmartContractsList,
    initMoralisIfNeeded,
    getNativeTokenFromCoingecko,
};
//# sourceMappingURL=smart-contract-info.logic.js.map