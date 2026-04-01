"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainsApi = void 0;
const light_node_logic_1 = require("../logic/evm/light-node.logic");
const setupGetChainsApi = (app) => {
    app.get("/chains", async (req, res) => {
        // const chains = await ChainLogic.getChains();
        const chains = await light_node_logic_1.EvmLightNodeLogic.getActiveChains();
        res.status(200).send(chains);
    });
};
const setupApis = (app) => {
    setupGetChainsApi(app);
};
exports.ChainsApi = {
    setupApis,
};
//# sourceMappingURL=chains.api.js.map