import { QuoteRequestFromAmount } from "@lifi/sdk";
import { TransactionAnalyticsStatus } from "@lifi/types";
import { Express } from "express";
import { LifiLogic } from "../../logic/evm/lifi.logic";

const setupApis = (app: Express) => {
  app.post("/evm/lifi/quote", async (req, res) => {
    console.log(req.body);
    const result = await LifiLogic.getQuote({
      fromChain: req.body.fromChain,
      fromToken: req.body.fromToken,
      fromAddress: req.body.fromAddress,
      fromAmount: req.body.amount,
      toChain: req.body.toChain,
      toToken: req.body.toToken,
      toAddress: req.body.toAddress,
    } as QuoteRequestFromAmount);
    res
      .status(result.status)
      .send(result.result ?? { errorCode: result.errorCode });
  });

  app.get("/evm/lifi/tokens/:chainId", async (req, res) => {
    const tokens = await LifiLogic.getTokens(req.params.chainId);
    res.status(200).send(tokens);
  });

  app.get("/evm/lifi/chains", async (req, res) => {
    const chains = await LifiLogic.getChains();
    res.status(200).send(chains);
  });

  app.get("/evm/lifi/history", async (req, res) => {
    const wallet = req.query.wallet as string;
    if (!wallet) {
      res.status(400).send({
        error: "Missing wallet query parameter",
      });
      return;
    }

    const status = req.query.status as TransactionAnalyticsStatus | undefined;

    const fromTimestamp = req.query.fromTimestamp
      ? parseInt(req.query.fromTimestamp as string, 10)
      : undefined;

    const toTimestamp = req.query.toTimestamp
      ? parseInt(req.query.toTimestamp as string, 10)
      : undefined;

    const result = await LifiLogic.getHistory({
      wallet: wallet,
      status,
      fromTimestamp: Number.isNaN(fromTimestamp) ? undefined : fromTimestamp,
      toTimestamp: Number.isNaN(toTimestamp) ? undefined : toTimestamp,
    });

    res.status(result.status).send(result.result ?? { error: result.error });
  });

  app.get("/evm/lifi/data", async (req, res) => {
    const chains = await LifiLogic.getChains();
    const tokens = await LifiLogic.getAllTokens();
    res.status(200).send({ chains, tokens });
  });
};

export const LifiApi = { setupApis };
