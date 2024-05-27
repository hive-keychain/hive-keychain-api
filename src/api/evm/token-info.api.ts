import { Express } from "express";
import { CoingeckoConfigLogic } from "../../logic/coingecko-config";
import {
  EVMTokenType,
  EvmTokenInfo,
  EvmTokenInfoShort,
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

    const tokensInfoShort: EvmTokenInfoShort[] = tokensInfo.map(
      (token: EvmTokenInfo) => {
        const {
          type,
          chainId,
          name,
          symbol,
          logo,
          backgroundColor,
          coingeckoId,
        } = token;

        return {
          type,
          chainId,
          name,
          symbol,
          logo,
          backgroundColor,
          coingeckoId,
          validated: type === EVMTokenType.ERC20 ? token.validated : undefined,
          possibleSpam:
            type === EVMTokenType.ERC20 ? token.possibleSpam : undefined,
          verifiedContract:
            type === EVMTokenType.ERC20 ? token.verifiedContract : undefined,
          address: type === EVMTokenType.ERC20 ? token.address : undefined,
          decimals: type === EVMTokenType.ERC20 ? token.decimals : undefined,
        };
      }
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
