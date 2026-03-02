import { EvmLightNodeLogic } from "./light-node.logic";

interface ChainGasFees {
  chainId: string;
  updatedAt: number;
  data: GasFees;
}

interface GasFees {
  low: GasFeeData;
  medium: GasFeeData;
  high: GasFeeData;
  estimatedBaseFee: string;
  networkCongestion: number;
  latestPriorityFeeRange: string[];
  historicalPriorityFeeRange: string[];
  historicalBaseFeeRange: string[];
  priorityFeeTrend: string;
  baseFeeTrend: string;
}

interface GasFeeData {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
}

const Auth = Buffer.from(
  process.env.INFURA_API_KEY + ":" + process.env.INFURA_API_KEY_SECRET,
).toString("base64");

const getGasFeesFromLightNode = async (chainId: string) => {
  const data = await EvmLightNodeLogic.getGasFee(chainId);
  console.log("data", data);
  return data;
};

export const GasPriceEstimateLogic = {
  getGasFeesFromLightNode,
};
