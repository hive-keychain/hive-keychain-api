"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BscTokensLogic = void 0;
const moralis_1 = require("../../utils/moralis");
const evm_smart_contracts_interface_1 = require("./interfaces/evm-smart-contracts.interface");
const smart_contract_info_logic_1 = require("./smart-contract-info.logic");
const getBscErc20 = async (walletAddress, chainId) => {
    const erc20Tokens = await moralis_1.MoralisApi.get(`${walletAddress}/erc20?chain=${chainId}`);
    const metadata = await smart_contract_info_logic_1.SmartContractsInfoLogic.getCurrentSmartContractList();
    for (const token of erc20Tokens) {
        if (!metadata.find((m) => m.contractAddress?.toLowerCase() === token.token_address.toLowerCase())) {
            metadata.push({
                type: evm_smart_contracts_interface_1.EVMSmartContractType.ERC20,
                chainId: chainId,
                contractAddress: token.token_address,
                decimals: token.decimals,
                possibleSpam: token.possible_spam,
                verifiedContract: token.verified_contract,
                symbol: token.symbol,
                logo: token.logo,
                name: token.name,
            });
        }
    }
    smart_contract_info_logic_1.SmartContractsInfoLogic.saveNewSmartContractsList(metadata);
    return erc20Tokens.map((token) => {
        return {
            type: evm_smart_contracts_interface_1.EVMSmartContractType.ERC20,
            chainId: chainId,
            contractAddress: token.token_address,
            decimals: token.decimals,
            possibleSpam: token.possible_spam,
            verifiedContract: token.verified_contract,
            symbol: token.symbol,
            logo: token.logo,
            name: token.name,
        };
    });
};
const getBscNfts = async (walletAddress, chainId) => {
    let nfts = [];
    let cursor = null;
    do {
        const res = await moralis_1.MoralisApi.get(`${walletAddress}/nft?chain=${chainId}&format=decimal&limit=100&normalizeMetadata=true&media_items=true&include_prices=false&cursor=${cursor}`);
        nfts = [...nfts, ...res.result];
        cursor = res.cursor;
    } while (cursor !== null);
    return nfts
        ? nfts.map((nft) => {
            return {
                type: nft.contract_type,
                contractAddress: nft.token_address,
                possibleSpam: nft.possible_spam,
                verifiedContract: nft.verified_collection,
                name: nft.name,
                symbol: nft.symbol,
                chainId: chainId,
                logo: nft.collection_logo,
                tokenId: nft.token_id,
                amount: nft.amount,
                metadata: nft.metadata ? JSON.parse(nft.metadata) : null,
            };
        })
        : [];
};
exports.BscTokensLogic = {
    getBscErc20,
    getBscNfts,
};
//# sourceMappingURL=bsc-tokens.logic.js.map