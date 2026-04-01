"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifiApi = void 0;
const lifi_logic_1 = require("../../logic/evm/lifi.logic");
const setupApis = (app) => {
    app.post("/evm/lifi/quote", async (req, res) => {
        console.log(req.body);
        const result = await lifi_logic_1.LifiLogic.getQuote({
            fromChain: req.body.fromChain,
            fromToken: req.body.fromToken,
            fromAddress: req.body.fromAddress,
            fromAmount: req.body.amount,
            toChain: req.body.toChain,
            toToken: req.body.toToken,
            toAddress: req.body.toAddress,
        });
        res
            .status(result.status)
            .send(result.result ?? { errorCode: result.errorCode });
    });
    app.get("/evm/lifi/tokens/:chainId", async (req, res) => {
        const tokens = await lifi_logic_1.LifiLogic.getTokens(req.params.chainId);
        res.status(200).send(tokens);
    });
    app.get("/evm/lifi/chains", async (req, res) => {
        const chains = await lifi_logic_1.LifiLogic.getChains();
        res.status(200).send(chains);
    });
    app.get("/evm/lifi/history", async (req, res) => {
        const wallet = req.query.wallet;
        if (!wallet) {
            res.status(400).send({
                error: "Missing wallet query parameter",
            });
            return;
        }
        const status = req.query.status;
        const fromTimestamp = req.query.fromTimestamp
            ? parseInt(req.query.fromTimestamp, 10)
            : undefined;
        const toTimestamp = req.query.toTimestamp
            ? parseInt(req.query.toTimestamp, 10)
            : undefined;
        const result = await lifi_logic_1.LifiLogic.getHistory({
            wallet: wallet,
            status,
            fromTimestamp: Number.isNaN(fromTimestamp) ? undefined : fromTimestamp,
            toTimestamp: Number.isNaN(toTimestamp) ? undefined : toTimestamp,
        });
        res.status(result.status).send(result.result ?? { error: result.error });
    });
    app.get("/evm/lifi/data", async (req, res) => {
        const chains = await lifi_logic_1.LifiLogic.getChains();
        const tokens = await lifi_logic_1.LifiLogic.getAllTokens();
        res.status(200).send({ chains, tokens });
    });
};
exports.LifiApi = { setupApis };
//# sourceMappingURL=lifi.api.js.map