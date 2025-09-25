import { Express } from "express";
import { EtherscanApi } from "../../logic/evm/block-explorer-api/etherscan.api";
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
    const info = await EtherscanApi.getEtherscanInfo(req.query);
    res.status(200).send(info);
  });
};

const setupApis = (app: Express) => {
  setupEtherscanGetInfoApi(app);
  setupRefreshSmartContractsInfo(app);
  setupGetSmartContractsInfo(app);
};

export const SmartContractsApi = { setupApis };
