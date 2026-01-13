"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalDataApi = void 0;
const historical_data_logic_1 = require("../../logic/hive/historical-data.logic");
const setupGetHistoricalDataApi = (app) => {
    app.get("/hive/v2/price-history", async (req, res) => {
        res.status(200).send(await historical_data_logic_1.HistoricalDataLogic.get());
    });
};
const setupApis = (app) => {
    setupGetHistoricalDataApi(app);
};
exports.HistoricalDataApi = {
    setupApis,
};
//# sourceMappingURL=historical-data.api.js.map