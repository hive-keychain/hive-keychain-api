import { EvmLightNodeLogic } from "./light-node.logic";

const getGasFeesFromLightNode = async (chainId: string) => {
  return await EvmLightNodeLogic.getGasFee(chainId);
};

export const GasPriceEstimateLogic = {
  getGasFeesFromLightNode,
};
