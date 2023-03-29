import Logger from "hive-keychain-commons/lib/logger/logger";
import {
  BaseEstimate,
  EstimateSwapStep,
} from "../../interfaces/swap.interface";
import { HBD, HIVE, SWAP_HIVE } from "../../interfaces/tokens.interface";
import { ConversionLogic } from "./convert/conversion.logic";
import { SwapTokenLogic } from "./swap-tokens/swap-token.logic";

const estimateSwapValue = async (
  startToken: string,
  endToken: string,
  amount: number
): Promise<EstimateSwapStep[] | string> => {
  let steps: EstimateSwapStep[] = [];
  Logger.info(`Trying to swap ${amount} ${startToken} to ${endToken}`);

  if (
    (startToken === HIVE && endToken === HBD) ||
    (startToken === HBD && endToken === HIVE)
  ) {
    const internalMarketConversionResult =
      await ConversionLogic.getInternalMarketConversionEstimate(
        startToken,
        endToken,
        amount
      );
    steps = [...steps, internalMarketConversionResult];
    return steps;
  }

  if (startToken === HIVE || startToken === HBD) {
    const conversionSteps = await ConversionLogic.getConversionEstimate(
      amount,
      startToken,
      SWAP_HIVE
    );
    steps = [...steps, ...conversionSteps];
    if (endToken === SWAP_HIVE) return steps;

    if (
      !conversionSteps ||
      conversionSteps[conversionSteps.length - 1]?.estimate === 0
    )
      return "Operation not possible at the moment";
  }

  // estimate swap token

  const swapStepStartToken =
    steps.length > 0 ? steps[steps.length - 1].endToken : startToken;
  const swapStepAmount =
    steps.length > 0 ? steps[steps.length - 1].estimate : amount;

  const swapEndToken =
    endToken === HIVE || endToken === HBD ? SWAP_HIVE : endToken;

  if (startToken !== SWAP_HIVE) {
    const swapValueSteps = await SwapTokenLogic.estimateSwapValue(
      swapStepStartToken,
      swapEndToken,
      swapStepAmount
    );
    steps = [...steps, ...swapValueSteps];

    if (swapValueSteps[swapValueSteps.length - 1].estimate === 0)
      return "Operation not possible at the moment";
  }

  if (endToken === HIVE || endToken === HBD) {
    const convertAmount =
      steps.length > 0 ? steps[steps.length - 1].estimate : amount;
    // estimate convert
    const finalConvertStep = await ConversionLogic.getConversionEstimate(
      convertAmount,
      SWAP_HIVE,
      endToken
    );
    steps = [...steps, ...finalConvertStep];
    if (finalConvertStep[finalConvertStep.length - 1].estimate === 0)
      return "Operation not possible at the moment";
  }
  return steps;
};

const initializeSwapRoutine = async () => {
  // TransactionsLogic.startLayer1Routine();
  // TransactionsLogic.startLayer2Routine();
};

const saveEstimate = async (baseEstimate: BaseEstimate) => {};

export const SwapsLogic = {
  estimateSwapValue,
  initializeSwapRoutine,
  saveEstimate,
};
