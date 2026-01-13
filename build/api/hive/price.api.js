"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceApi = void 0;
const price_logic_1 = require("../../logic/hive/price.logic");
const setupGetPriceApi = (app) => {
    app.get("/hive/v2/price", async (req, res) => {
        res.status(200).send(await price_logic_1.PriceLogic.getPrices());
    });
};
const setupApis = (app) => {
    setupGetPriceApi(app);
};
exports.PriceApi = {
    setupApis,
};
//# sourceMappingURL=price.api.js.map