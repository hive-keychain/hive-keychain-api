import Logger from "hive-keychain-commons/lib/logger/logger";
import {
  Provider,
  SwapStep,
  SwapStepType,
} from "../../../interfaces/swap.interface";
import { HBD, HIVE, SWAP_HIVE } from "../../../interfaces/tokens.interface";
import { ConvertProviderLogic } from "./convert-provider.logic";
import { InternalMarketLogic } from "./internal-market.logic";

const getConversionEstimate = async (
  amount: number,
  startToken: string,
  endToken: string
) => {
  Logger.info(`Trying to convert ${amount} ${startToken} to ${endToken}`);
  if (startToken === HIVE) {
    return [await getDepositEstimates(amount)];
  } else if (startToken === HBD) {
    const internalMarketResult = await getInternalMarketConversionEstimate(
      startToken,
      HIVE,
      amount
    );
    return [
      internalMarketResult,
      await getDepositEstimates(internalMarketResult.estimate),
    ];
  } else if (endToken === HIVE) {
    return [
      await getInternalMarketConversionEstimate(startToken, endToken, amount),
    ];
  } else if (endToken === HBD) {
    const withdrawalEstimateStep = await getWithdrawalEstimates(amount);
    return [
      withdrawalEstimateStep,
      await getInternalMarketConversionEstimate(
        HIVE,
        endToken,
        withdrawalEstimateStep.estimate
      ),
    ];
  }
};

// Only used in the case of HIVE<->HBD
const getInternalMarketConversionEstimate = async (
  startToken: string,
  endToken: string,
  amount: number
): Promise<SwapStep> => {
  Logger.info(
    `Trying to convert ${amount} ${startToken} to ${endToken} through Hive internal market`
  );

  if (startToken === HIVE) {
    return InternalMarketLogic.estimateHiveToHbd(amount);
  } else {
    return InternalMarketLogic.estimateHbdToHive(amount);
  }
};

const getWithdrawalEstimates = async (amount: number) => {
  const withdrawalSteps = await Promise.all([
    ConvertProviderLogic.getWithdrawalEstimate(amount, Provider.BEESWAP),
    ConvertProviderLogic.getWithdrawalEstimate(
      amount,
      Provider.DISCOUNTED_BRIDGE
    ),
    ConvertProviderLogic.getWithdrawalEstimate(amount, Provider.HIVE_PAY),
    ConvertProviderLogic.getWithdrawalEstimate(amount, Provider.LEODEX),
    ConvertProviderLogic.getWithdrawalEstimate(amount, Provider.HIVE_ENGINE),
  ]);

  let selectedWithdrawalStep: SwapStep = {
    step: SwapStepType.WITHDRAWAL_FROM_HIVE_ENGINE,
    provider: "",
    startToken: SWAP_HIVE,
    endToken: HIVE,
    estimate: 0,
  };

  console.log("------------getWithdrawalEstimates------------");
  console.log(withdrawalSteps);
  console.log("------------------------");

  for (const step of withdrawalSteps) {
    if (step.estimate > selectedWithdrawalStep.estimate) {
      selectedWithdrawalStep = step;
    }
  }

  return selectedWithdrawalStep;
};

const getDepositEstimates = async (amount: number) => {
  const depositEstimateSteps = await Promise.all([
    ConvertProviderLogic.getDepositEstimate(amount, Provider.BEESWAP),
    ConvertProviderLogic.getDepositEstimate(amount, Provider.DISCOUNTED_BRIDGE),
    ConvertProviderLogic.getDepositEstimate(amount, Provider.HIVE_PAY),
    ConvertProviderLogic.getDepositEstimate(amount, Provider.LEODEX),
    ConvertProviderLogic.getDepositEstimate(amount, Provider.HIVE_ENGINE),
  ]);

  console.log("------------getDepositEstimates------------");
  console.log(depositEstimateSteps);
  console.log("------------------------");

  let selectedDepositStep: SwapStep = {
    step: SwapStepType.DEPOSIT_TO_HIVE_ENGINE,
    provider: "",
    startToken: HIVE,
    endToken: SWAP_HIVE,
    estimate: 0,
  };

  for (const step of depositEstimateSteps) {
    if (step.estimate > selectedDepositStep.estimate) {
      selectedDepositStep = step;
    }
  }

  return selectedDepositStep;
};

export const ConversionLogic = {
  getConversionEstimate,
  getInternalMarketConversionEstimate,
};
