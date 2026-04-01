"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasPriceEstimateLogic = void 0;
const light_node_logic_1 = require("./light-node.logic");
const getGasFeesFromLightNode = async (chainId) => {
    return await light_node_logic_1.EvmLightNodeLogic.getGasFee(chainId);
};
exports.GasPriceEstimateLogic = {
    getGasFeesFromLightNode,
};
//# sourceMappingURL=gas-price-estimate.logic.js.map