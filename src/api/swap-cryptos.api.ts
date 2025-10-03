import { Express } from "express";
import { query } from "express-validator";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { SwapCryptoLogic } from "../logic/swap-crypto.logic";

const setupApis = (app: Express) => {
  app.get("/swap-cryptos/currencies", async (req, res) => {
    const currencyOptions = await SwapCryptoLogic.getCurrencyOptions();
    Logger.info(`Get swap cryptos currencies`);
    res.status(200).send(currencyOptions);
  });

  app.get(
    "/swap-cryptos/range/:tokenFrom/:networkFrom/:tokenTo/:networkTo",
    query("tokenFrom").isString().not().isEmpty().escape(),
    query("networkFrom").isString().not().isEmpty().escape(),
    query("tokenTo").isString().not().isEmpty().escape(),
    query("networkTo").isString().not().isEmpty().escape(),
    async (req, res) => {
      const currencyRange = await SwapCryptoLogic.getRange(
        req.params!.tokenFrom,
        req.params!.networkFrom,
        req.params!.tokenTo,
        req.params!.networkTo
      );
      Logger.info(`Get swap cryptos range`);
      res.status(200).send(currencyRange);
    }
  );

  app.get(
    "/swap-cryptos/estimate/:amount/:tokenFrom/:networkFrom/:tokenTo/:networkTo",
    query("tokenFrom").isString().not().isEmpty().escape(),
    query("networkFrom").isString().not().isEmpty().escape(),
    query("tokenTo").isString().not().isEmpty().escape(),
    query("networkTo").isString().not().isEmpty().escape(),
    query("amount").isString().not().isEmpty().escape(),
    async (req, res) => {
      const estimation = await SwapCryptoLogic.getExchangeEstimation(
        req.params!.amount,
        req.params!.tokenFrom,
        req.params!.networkFrom,
        req.params!.tokenTo,
        req.params!.networkTo
      );
      Logger.info(`Get swap cryptos estimation`);
      res.status(200).send(estimation);
    }
  );
};

export const SwapCryptosApi = { setupApis };
