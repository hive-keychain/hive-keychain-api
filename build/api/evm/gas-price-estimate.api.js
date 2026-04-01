"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasPriceEstimateApi = void 0;
const gas_price_estimate_logic_1 = require("../../logic/evm/gas-price-estimate.logic");
const setupGasPriceEstimate = (app) => {
    app.get("/evm/gasPriceEstimate/:chainId", async (req, res) => {
        const gasPriceEstimate = await gas_price_estimate_logic_1.GasPriceEstimateLogic.getGasFeesFromLightNode(req.params.chainId);
        res.status(200).send(gasPriceEstimate);
    });
};
const setupApis = (app) => {
    setupGasPriceEstimate(app);
};
exports.GasPriceEstimateApi = { setupApis };
//# sourceMappingURL=gas-price-estimate.api.js.map