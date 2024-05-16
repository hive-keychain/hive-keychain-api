import { Express } from "express";
import { TokensInfoLogic } from "../../logic/evm/tokens-info.logic";

const setupGetTokensInfo = (app: Express) => {
  app.get("/evm/tokensInfo/:chainId/:addresses", async (req, res) => {
    const tokensInfo = await TokensInfoLogic.getTokensInfo(
      req.params.chainId,
      req.params.addresses.toLowerCase().split(",")
    );
    res.status(200).send(tokensInfo);
  });
  app.get("/evm/tokensInfoShort/:chainId/:addresses", async (req, res) => {
    const tokensInfo = await TokensInfoLogic.getTokensInfo(
      req.params.chainId,
      req.params.addresses.toLowerCase().split(",")
    );
    const tokensInfoShort = tokensInfo.map(
      ({
        chainId,
        address,
        name,
        symbol,
        decimals,
        logo,
        backgroundColor,
        validated,
        possibleSpam,
        verifiedContract,
      }) => ({
        address,
        name,
        symbol,
        decimals,
        logo,
        backgroundColor,
        validated,
        possibleSpam,
        verifiedContract,
      })
    );
    res.status(200).send(tokensInfoShort);
  });
};

const setupApis = (app: Express) => {
  setupGetTokensInfo(app);
};

export const TokensInfoApi = { setupApis };
