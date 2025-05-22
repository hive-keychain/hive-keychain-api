import { Express } from "express";
import { SmartContractsInfoLogic } from "../../logic/evm/smart-contract-info.logic";

const setupGetSmartContractsInfo = (app: Express) => {
  app.get("/evm/smart-contracts-info/:chainId/:addresses", async (req, res) => {
    const tokensInfo = await SmartContractsInfoLogic.getSmartContractInfo(
      req.params.chainId,
      req.params.addresses.toLowerCase().split(",")
    );
    res.status(200).send(tokensInfo);
  });

  // app.get(
  //   "/evm/smart-contract-info-short/:chainId/:addresses?",
  //   async (req, res) => {
  //     res
  //       .status(200)
  //       .send(
  //         await SmartContractsInfoLogic.getSmartContractsInfoShort(
  //           req.params.chainId,
  //           req.params.addresses
  //             ? req.params.addresses.toLowerCase().split(",")
  //             : []
  //         )
  //       );
  //   }
  // );
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
      console.log(req.query.refreshMetadataPassword);
      res.status(403).send("Non authorized");
    }
  });
};

const setupApis = (app: Express) => {
  setupGetSmartContractsInfo(app);
  setupRefreshSmartContractsInfo(app);
};

export const SmartContractsApi = { setupApis };
