import { Express } from "express";
import { CoingeckoConfigLogic } from "../../logic/coingecko-config";
import {
  EVMTokenInfoShort,
  TokensInfoLogic,
} from "../../logic/evm/tokens-info.logic";

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
    const tokensInfoShort: EVMTokenInfoShort[] = tokensInfo.map(
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
        coingeckoId,
      }) => ({
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
        coingeckoId,
      })
    );
    res.status(200).send(tokensInfoShort);
  });
};

const setupGetMainTokenCoingeckoId = (app: Express) => {
  app.get("/evm/coingecko-id/:chainId", async (req, res) => {
    res.status(200).send({
      id: await CoingeckoConfigLogic.getCoingeckoId(req.params.chainId),
    });
  });
};

const setupApis = (app: Express) => {
  setupGetTokensInfo(app);
  setupGetMainTokenCoingeckoId(app);
};

export const TokensInfoApi = { setupApis };
