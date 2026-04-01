"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceApi = void 0;
const light_node_logic_1 = require("../logic/evm/light-node.logic");
const price_logic_1 = require("../logic/price.logic");
const setupGetHivePriceApi = (app) => {
    app.get("/hive/v2/price", async (req, res) => {
        res.status(200).send(price_logic_1.PriceLogic.getHivePrices());
    });
};
const setupGetEvmPriceApi = (app) => {
    app.get("/evm/light-node/price/:chainId/:tokenAddress?", async (req, res) => {
        res
            .status(200)
            .send(await light_node_logic_1.EvmLightNodeLogic.getPrice(req.params.chainId, req.params.tokenAddress));
    });
};
const setupApis = (app) => {
    setupGetHivePriceApi(app);
    setupGetEvmPriceApi(app);
};
exports.PriceApi = {
    setupApis,
};
//# sourceMappingURL=price.api.js.map