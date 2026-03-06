import { Express } from "express";
import { EvmLightNodeLogic } from "../../logic/evm/light-node.logic";

const setupGetDiscoveredTokensApi = (app: Express) => {
  app.get(
    "/evm/light-node/discovery/tokens/:chainId/:address",
    async (req, res) => {
      const discoveredTokens = await EvmLightNodeLogic.getDiscoveredTokens(
        req.params.chainId,
        req.params.address,
      );
      res.status(200).send(discoveredTokens);
    },
  );
};

const setupGetDiscoveredNftsApi = (app: Express) => {
  app.get(
    "/evm/light-node/discovery/nfts/:chainId/:address",
    async (req, res) => {
      const discoveredNfts = await EvmLightNodeLogic.getDiscoveredNfts(
        req.params.chainId,
        req.params.address,
      );
      res.status(200).send(discoveredNfts);
    },
  );
};

const setupGetNftDetailApi = (app: Express) => {
  app.get("/evm/light-node/nft/detail/:chainId/:nftId", async (req, res) => {
    const nftDetail = await EvmLightNodeLogic.getNftDetail(
      req.params.chainId,
      req.params.nftId,
    );
    res.status(200).send(nftDetail);
  });
};

const setupGetHistoryApi = (app: Express) => {
  app.get("/evm/light-node/history/:chainId/:address", async (req, res) => {
    const cursor =
      typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const parsedLimit =
      typeof req.query.limit === "string"
        ? Number.parseInt(req.query.limit, 10)
        : undefined;
    const limit =
      typeof parsedLimit === "number" && !Number.isNaN(parsedLimit)
        ? parsedLimit
        : undefined;

    const history = await EvmLightNodeLogic.getHistory(
      req.params.chainId,
      req.params.address,
      cursor,
      limit,
    );
    res.status(200).send(history);
  });
};

const setupGetHistoryDetailApi = (app: Express) => {
  app.get("/evm/light-node/history/detail/:chainId/:txId", async (req, res) => {
    const historyDetail = await EvmLightNodeLogic.getHistoryDetail(
      req.params.chainId,
      req.params.txId,
    );
    res.status(200).send(historyDetail);
  });
};

const setupGetContractApi = (app: Express) => {
  app.get(
    "/evm/light-node/contract/:chainId/:contractAddress",
    async (req, res) => {
      const contract = await EvmLightNodeLogic.getContract(
        req.params.chainId,
        req.params.contractAddress,
      );
      res.status(200).send(contract);
    },
  );
};

const setupGetGasFeeApi = (app: Express) => {
  app.get("/evm/light-node/gas-fee/:chainId", async (req, res) => {
    const gasFee = await EvmLightNodeLogic.getGasFee(req.params.chainId);
    res.status(200).send(gasFee);
  });
};

const setupGetPriceApi = (app: Express) => {
  app.get("/evm/light-node/price/:chainId/:tokenAddress", async (req, res) => {
    const price = await EvmLightNodeLogic.getPrice(
      req.params.chainId,
      req.params.tokenAddress,
    );
    res.status(200).send(price);
  });
};

const setupRegisterAddressApi = (app: Express) => {
  app.get(
    "/evm/light-node/register-address/:chainId/:address/:newAddress?",
    async (req, res) => {
      await EvmLightNodeLogic.registerAddress(
        req.params.chainId,
        req.params.address,
        JSON.parse(req.params.newAddress),
      );
      res.status(200).send({ result: "ok" });
    },
  );
};

const setupApis = (app: Express) => {
  setupGetDiscoveredTokensApi(app);
  setupGetDiscoveredNftsApi(app);
  setupGetNftDetailApi(app);
  setupGetHistoryApi(app);
  setupGetHistoryDetailApi(app);
  setupGetContractApi(app);
  setupGetGasFeeApi(app);
  setupGetPriceApi(app);
  setupRegisterAddressApi(app);
};

export const LightNodeApi = { setupApis };
