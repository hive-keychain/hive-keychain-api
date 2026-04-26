"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceApi = void 0;
const price_logic_1 = require("../logic/price.logic");
const setupGetHivePriceApi = (app) => {
    app.get("/hive/v2/price", async (req, res) => {
        res.status(200).send(price_logic_1.PriceLogic.getHivePrices());
    });
};
const setupApis = (app) => {
    setupGetHivePriceApi(app);
};
exports.PriceApi = {
    setupApis,
};
//# sourceMappingURL=price.api.js.map