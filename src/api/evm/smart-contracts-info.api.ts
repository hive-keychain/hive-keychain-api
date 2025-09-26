import { Express } from "express";
import { EtherscanLogic } from "../../logic/evm/block-explorer-api/etherscan.logic";
import { EvmChainsLogic } from "../../logic/evm/chains.logic";
import { SmartContractsInfoLogic } from "../../logic/evm/smart-contract-info.logic";

const setupGetSmartContractsInfo = (app: Express) => {
  app.get("/evm/smart-contracts-info/:chainId", async (req, res) => {
    const addresses = req.query.addresses
      ? req.query.addresses.toString().toLowerCase().split(",")
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

const setupApis = (app: Express) => {
  setupEtherscanGetInfoApi(app);
  setupRefreshSmartContractsInfo(app);
  setupGetSmartContractsInfo(app);
  setupGetPopularToken(app);
};

export const SmartContractsApi = { setupApis };
