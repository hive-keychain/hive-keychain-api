import Logger from "hive-keychain-commons/lib/logger/logger";
import { BalancesUtils } from "../../../utils/balances.utils";
import {
  EstimateSwapStep,
  Provider,
  SwapStepType,
} from "../../interfaces/swap.interface";
import { HIVE, SWAP_HIVE } from "../../interfaces/tokens.interface";
import { ConvertProviderConfig } from "./convert-provider.config";

const getDepositEstimate = async (
  amount: number,
  provider: Provider
): Promise<EstimateSwapStep> => {
  const providerConfig = ConvertProviderConfig.getConfig(provider);

  const balances = await BalancesUtils.getBalances(providerConfig.accountName);

  let finalAmount = 0;
  if (balances.swapHive >= amount || providerConfig.deposit.skipBalanceCheck) {
    Logger.info(
      `${providerConfig.fullName} SWAP.HIVE balance (${balances.swapHive}) is sufficient for a deposit`
    );

    if (
      providerConfig.deposit.balancedFreeFee &&
      balances.swapHive > balances.hive
    ) {
      finalAmount = amount;
    } else {
      const fee = Math.max(
        (amount * providerConfig.deposit.fee) / 100,
        providerConfig.deposit.minimumFee
      );
      finalAmount = amount - fee;
    }
  } else {
    Logger.info(
      `${providerConfig.fullName} SWAP.HIVE balance (${balances.swapHive}) unsufficient for a deposit`
    );
  }
  return {
    step: SwapStepType.DEPOSIT_TO_HIVE_ENGINE,
    provider: providerConfig.name,
    startToken: HIVE,
    endToken: SWAP_HIVE,
    estimate: finalAmount,
  };
};

const getWithdrawalEstimate = async (
  amount: number,
  provider: Provider
): Promise<EstimateSwapStep> => {
  const providerConfig = ConvertProviderConfig.getConfig(provider);

  const balances = await BalancesUtils.getBalances(providerConfig.accountName);

  let finalAmount = 0;
  if (balances.hive >= amount || providerConfig.withdrawal.skipBalanceCheck) {
    Logger.info(
      `${providerConfig.fullName} HIVE balance (${balances.hive}) is sufficient for a withdrawal`
    );

    if (
      providerConfig.withdrawal.balancedFreeFee &&
      balances.hive > balances.swapHive
    ) {
      finalAmount = amount;
    } else {
      const fee = Math.max(
        (amount * providerConfig.withdrawal.fee) / 100.0,
        providerConfig.withdrawal.minimumFee
      );
      finalAmount = amount - fee;
    }
  } else {
    Logger.info(
      `${providerConfig.fullName} HIVE balance (${balances.hive}) unsufficient for a withdrawal`
    );
  }
  return {
    step: SwapStepType.WITHDRAWAL_FROM_HIVE_ENGINE,
    provider: providerConfig.name,
    startToken: SWAP_HIVE,
    endToken: HIVE,
    estimate: finalAmount,
  };
};

export const ConvertProviderLogic = {
  getDepositEstimate,
  getWithdrawalEstimate,
};