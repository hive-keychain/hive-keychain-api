import Logger from "hive-keychain-commons/lib/logger/logger";
import {
  Provider,
  SwapStep,
  SwapStepType,
} from "../../../interfaces/swap.interface";
import { HIVE, SWAP_HIVE } from "../../../interfaces/tokens.interface";
import { BalancesUtils } from "../../../utils/balances.utils";
import { ConvertProviderConfig } from "./convert-provider.config";

const getDepositEstimate = async (
  amount: number,
  provider: Provider
): Promise<SwapStep> => {
  const providerConfig = ConvertProviderConfig.getConfig(provider);

  const balances = await BalancesUtils.getBalances(providerConfig.accountName);

  let finalAmount = 0;
  if (balances.swapHive >= amount) {
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
        amount * providerConfig.deposit.fee,
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
    provider: providerConfig.name,
    startToken: HIVE,
    endToken: SWAP_HIVE,
    estimate: finalAmount,
    step: SwapStepType.DEPOSIT_TO_HIVE_ENGINE,
  };
};

const getWithdrawalEstimate = async (
  amount: number,
  provider: Provider
): Promise<SwapStep> => {
  const providerConfig = ConvertProviderConfig.getConfig(provider);

  const balances = await BalancesUtils.getBalances(providerConfig.accountName);

  let finalAmount = 0;
  if (balances.hive >= amount) {
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
        amount * providerConfig.withdrawal.fee,
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
    provider: providerConfig.name,
    startToken: SWAP_HIVE,
    endToken: HIVE,
    estimate: finalAmount,
    step: SwapStepType.WITHDRAWAL_FROM_HIVE_ENGINE,
  };
};

export const ConvertProviderLogic = {
  getDepositEstimate,
  getWithdrawalEstimate,
};
