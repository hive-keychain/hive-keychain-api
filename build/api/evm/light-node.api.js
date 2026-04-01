"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightNodeApi = void 0;
const light_node_logic_1 = require("../../logic/evm/light-node.logic");
const setupGetDiscoveredTokensApi = (app) => {
    app.get("/evm/light-node/discovery/tokens/:chainId/:address", async (req, res) => {
        const discoveredTokens = await light_node_logic_1.EvmLightNodeLogic.getDiscoveredTokens(req.params.chainId, req.params.address);
        res.status(200).send(discoveredTokens);
    });
};
const setupGetDiscoveredNftsApi = (app) => {
    app.get("/evm/light-node/discovery/nfts/:chainId/:address", async (req, res) => {
        const discoveredNfts = await light_node_logic_1.EvmLightNodeLogic.getDiscoveredNfts(req.params.chainId, req.params.address);
        res.status(200).send(discoveredNfts);
    });
};
const setupGetNftDetailApi = (app) => {
    app.get("/evm/light-node/nft/detail/:chainId/:nftId", async (req, res) => {
        const nftDetail = await light_node_logic_1.EvmLightNodeLogic.getNftDetail(req.params.chainId, req.params.nftId);
        res.status(200).send(nftDetail);
    });
};
const setupGetHistoryApi = (app) => {
    app.get("/evm/light-node/history/:chainId/:address", async (req, res) => {
        const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
        const parsedLimit = typeof req.query.limit === "string"
            ? Number.parseInt(req.query.limit, 10)
            : undefined;
        const limit = typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
            ? parsedLimit
            : undefined;
        const history = await light_node_logic_1.EvmLightNodeLogic.getHistory(req.params.chainId, req.params.address, cursor, limit);
        res.status(200).send(history);
    });
};
const setupGetHistoryDetailApi = (app) => {
    app.get("/evm/light-node/history/detail/:chainId/:txId", async (req, res) => {
        const historyDetail = await light_node_logic_1.EvmLightNodeLogic.getHistoryDetail(req.params.chainId, req.params.txId);
        res.status(200).send(historyDetail);
    });
};
const setupGetContractApi = (app) => {
    app.get("/evm/light-node/contract/:chainId/:contractAddress", async (req, res) => {
        const contract = await light_node_logic_1.EvmLightNodeLogic.getContract(req.params.chainId, req.params.contractAddress);
        res.status(200).send(contract);
    });
};
const setupGetGasFeeApi = (app) => {
    app.get("/evm/light-node/gas-fee/:chainId", async (req, res) => {
        const gasFee = await light_node_logic_1.EvmLightNodeLogic.getGasFee(req.params.chainId);
        res.status(200).send(gasFee);
    });
};
const setupGetPriceApi = (app) => {
    app.get("/evm/light-node/price/:chainId/:tokenAddress", async (req, res) => {
        const price = await light_node_logic_1.EvmLightNodeLogic.getPrice(req.params.chainId, req.params.tokenAddress);
        res.status(200).send(price);
    });
};
const setupGetNativeApi = (app) => {
    app.get("/evm/light-node/native/:chainId", async (req, res) => {
        const native = await light_node_logic_1.EvmLightNodeLogic.getNative(req.params.chainId);
        res.status(200).send(native);
    });
};
const setupGetActiveChainsApi = (app) => {
    app.get("/evm/light-node/chains", async (_req, res) => {
        const chains = await light_node_logic_1.EvmLightNodeLogic.getActiveChains();
        res.status(200).send(chains);
    });
};
const setupRegisterAddressApi = (app) => {
    app.get("/evm/light-node/register-address/:chainId/:address/:newAddress?", async (req, res) => {
        await light_node_logic_1.EvmLightNodeLogic.registerAddress(req.params.chainId, req.params.address, JSON.parse(req.params.newAddress));
        res.status(200).send({ result: "ok" });
    });
};
const setupApis = (app) => {
    setupGetDiscoveredTokensApi(app);
    setupGetDiscoveredNftsApi(app);
    setupGetNftDetailApi(app);
    setupGetHistoryApi(app);
    setupGetHistoryDetailApi(app);
    setupGetContractApi(app);
    setupGetGasFeeApi(app);
    setupGetPriceApi(app);
    setupGetNativeApi(app);
    setupGetActiveChainsApi(app);
    setupRegisterAddressApi(app);
};
exports.LightNodeApi = { setupApis };
//# sourceMappingURL=light-node.api.js.map