import { Express } from "express";
import { EtherscanLogic } from "../../logic/evm/block-explorer-api/etherscan.logic";
import { BscTokensLogic } from "../../logic/evm/bsc-tokens.logic";
import { EvmChainsLogic } from "../../logic/evm/chains.logic";
import { defaultChainList } from "../../logic/evm/data/chains.list";
import { SmartContractAddress } from "../../logic/evm/interfaces/evm-smart-contracts.interface";
import { NftLogic } from "../../logic/evm/nft.logic";
import { SmartContractsInfoLogic } from "../../logic/evm/smart-contract-info.logic";

const setupGetSmartContractsInfo = (app: Express) => {
  app.post("/evm/smart-contracts-info/:chainId", async (req, res) => {
    const addresses: SmartContractAddress[] = req.body.addresses
      ? req.body.addresses
      : [];
    const tokensInfo = await SmartContractsInfoLogic.getSmartContractInfo(
      req.params.chainId,
      addresses
    );
    res.status(200).send(tokensInfo);
  });
};

const setupRefreshSmartContractsInfo = (app: Express) => {
  app.get("/evm/smart-contracts-info/refresh", async (req, res) => {
    if (
      req.query.refreshMetadataPassword &&
      req.query.refreshMetadataPassword === process.env.REFRESH_METADATA_PWD
    ) {
      await SmartContractsInfoLogic.refreshNullTokens();
      res.status(200).send("ok");
    } else {
      res.status(403).send("Non authorized");
    }
  });
};

const setupEtherscanGetInfoApi = (app: Express) => {
  app.get("/evm/smart-contracts-info/etherscan", async (req, res) => {
    const info = await EtherscanLogic.getEtherscanInfo(req.query);
    res.status(200).send(info);
  });
};

const setupGetPopularToken = (app: Express) => {
  app.get("/evm/token/:chainId/popular", async (req, res) => {
    const tokens = await EvmChainsLogic.getPopularTokens(req.params.chainId);
    res.status(200).send(tokens);
  });
};

const setupGetTokensPerChain = (app: Express) => {
  const ACCEPTED_CHAINS = ["0x38", "0x61"];
  app.get(
    "/evm/:chainId/wallet/:walletAddress/discover-tokens-erc20",
    async (req, res) => {
      if (!ACCEPTED_CHAINS.includes(req.params.chainId)) {
        res.status(400).send("Invalid chainId");
        return;
      }
      const tokens = await BscTokensLogic.getBscErc20(
        req.params.walletAddress,
        req.params.chainId
      );
      console.log({ tokens });
      res.status(200).send(tokens);
    }
  );
  app.get(
    "/evm/:chainId/wallet/:walletAddress/discover-tokens-nfts",
    async (req, res) => {
      if (!ACCEPTED_CHAINS.includes(req.params.chainId)) {
        res.status(400).send("Invalid chainId");
        return;
      }
      const tokens = await BscTokensLogic.getBscNfts(
        req.params.walletAddress,
        req.params.chainId
      );
      console.log({ tokens });
      res.status(200).send(tokens);
    }
  );
};

const setupGetOpenSeaNftMetadata = (app: Express) => {
  app.get(
    "/evm/:openSeaChainId/nft/:contractAddress/:tokenId",
    async (req, res) => {
      const chain = defaultChainList.find(
        (c) =>
          !!c.openSeaChainId && c.openSeaChainId === req.params.openSeaChainId
      );

      if (!chain) {
        res.status(400).send("Invalid chainId");
        return;
      }

      const metadata = await NftLogic.getOpenSeaMetadata(
        req.params.contractAddress,
        chain,
        req.params.tokenId
      );
      res.status(200).send(metadata);
    }
  );
};

const setupApis = (app: Express) => {
  setupEtherscanGetInfoApi(app);
  setupRefreshSmartContractsInfo(app);
  setupGetSmartContractsInfo(app);
  setupGetPopularToken(app);
  setupGetTokensPerChain(app);
  setupGetOpenSeaNftMetadata(app);
};

export const SmartContractsApi = { setupApis };
