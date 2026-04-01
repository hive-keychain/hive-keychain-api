"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chain_logic_1 = require("../../logic/chain.logic");
const etherscan_logic_1 = require("../../logic/evm/block-explorer-api/etherscan.logic");
const bsc_tokens_logic_1 = require("../../logic/evm/bsc-tokens.logic");
const chains_logic_1 = require("../../logic/evm/chains.logic");
const evm_chain_interfaces_1 = require("../../logic/evm/interfaces/evm-chain.interfaces");
const nft_logic_1 = require("../../logic/evm/nft.logic");
const smart_contract_info_logic_1 = require("../../logic/evm/smart-contract-info.logic");
const setupGetSmartContractsInfo = (app) => {
    app.post("/evm/smart-contracts-info/:chainId", async (req, res) => {
        const addresses = req.body.addresses
            ? req.body.addresses
            : [];
        const tokensInfo = await smart_contract_info_logic_1.SmartContractsInfoLogic.getSmartContractInfo(req.params.chainId, addresses);
        res.status(200).send(tokensInfo);
    });
};
const setupRefreshSmartContractsInfo = (app) => {
    app.get("/evm/smart-contracts-info/refresh", async (req, res) => {
        if (req.query.refreshMetadataPassword &&
            req.query.refreshMetadataPassword === process.env.REFRESH_METADATA_PWD) {
            await smart_contract_info_logic_1.SmartContractsInfoLogic.refreshNullTokens();
            res.status(200).send("ok");
        }
        else {
            res.status(403).send("Non authorized");
        }
    });
};
const setupEtherscanGetInfoApi = (app) => {
    app.get("/evm/smart-contracts-info/etherscan", async (req, res) => {
        const info = await etherscan_logic_1.EtherscanLogic.getEtherscanInfo(req.query);
        res.status(200).send(info);
    });
};
const setupGetPopularToken = (app) => {
    app.get("/evm/token/:chainId/popular", async (req, res) => {
        const tokens = await chains_logic_1.EvmChainsLogic.getPopularTokens(req.params.chainId);
        res.status(200).send(tokens);
    });
};
const setupGetTokensPerChain = (app) => {
    const ACCEPTED_CHAINS = ["0x38", "0x61"];
    app.get("/evm/:chainId/wallet/:walletAddress/discover-tokens-erc20", async (req, res) => {
        if (!ACCEPTED_CHAINS.includes(req.params.chainId)) {
            res.status(400).send("Invalid chainId");
            return;
        }
        const tokens = await bsc_tokens_logic_1.BscTokensLogic.getBscErc20(req.params.walletAddress, req.params.chainId);
        console.log({ tokens });
        res.status(200).send(tokens);
    });
    app.get("/evm/:chainId/wallet/:walletAddress/discover-tokens-nfts", async (req, res) => {
        if (!ACCEPTED_CHAINS.includes(req.params.chainId)) {
            res.status(400).send("Invalid chainId");
            return;
        }
        const tokens = await bsc_tokens_logic_1.BscTokensLogic.getBscNfts(req.params.walletAddress, req.params.chainId);
        // console.log({ tokens });
        res.status(200).send(tokens);
    });
};
const setupGetOpenSeaNftMetadata = (app) => {
    app.get("/evm/:openSeaChainId/nft/:contractAddress/:tokenId", async (req, res) => {
        const chain = (await chain_logic_1.ChainLogic.getEvmChains()).find((c) => c.type === evm_chain_interfaces_1.ChainType.EVM &&
            !!c.openSeaChainId &&
            c.openSeaChainId === req.params.openSeaChainId);
        if (!chain) {
            res.status(400).send("Invalid chainId");
            return;
        }
        const metadata = await nft_logic_1.NftLogic.getOpenSeaMetadata(req.params.contractAddress, chain, req.params.tokenId);
        res.status(200).send(metadata);
    });
};
const setupApis = (app) => {
    setupEtherscanGetInfoApi(app);
    setupRefreshSmartContractsInfo(app);
    setupGetSmartContractsInfo(app);
    setupGetPopularToken(app);
    setupGetTokensPerChain(app);
    setupGetOpenSeaNftMetadata(app);
};
// export const SmartContractsApi = { setupApis };
//# sourceMappingURL=smart-contracts-info.api.js.map