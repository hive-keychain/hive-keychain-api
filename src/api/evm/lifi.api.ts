import { QuoteRequestFromAmount } from "@lifi/sdk";
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
    res.status(result.status).send(result.result ?? result.error);
  });

  app.get("/evm/lifi/tokens/:chainId", async (req, res) => {
    const tokens = await LifiLogic.getTokens(req.params.chainId);
    res.status(200).send(tokens);
  });

  app.get("/evm/lifi/chains", async (req, res) => {
    const chains = await LifiLogic.getChains();
    res.status(200).send(chains);
  });
  app.get("/evm/lifi/data", async (req, res) => {
    const chains = await LifiLogic.getChains();
    const tokens = await LifiLogic.getAllTokens();
    res.status(200).send({ chains, tokens });
  });
};

export const LifiApi = { setupApis };
