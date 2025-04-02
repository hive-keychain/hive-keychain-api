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

const setupApis = (app: Express) => {
  setupGetSmartContractsInfo(app);
};

export const SmartContractsApi = { setupApis };
