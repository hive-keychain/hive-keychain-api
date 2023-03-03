import { BalancesUtils } from "../../utils/balances.utils";

const DISCOUNTED_BRIDGE_ACCOUNT = "uswap";
const WITHDRAWAL_FEE = 0.1;
const DEPOSIT_FEE = 0.1;

const getBalances = async () => {
  return {
    hive: await BalancesUtils.getHiveBalance(DISCOUNTED_BRIDGE_ACCOUNT),
    swapHive: await BalancesUtils.getSwapHiveBalance(DISCOUNTED_BRIDGE_ACCOUNT),
  };
};

const getWithdrawalEstimate = async (amount: number) => {
  const balances = await getBalances();
  if (balances.hive >= amount) {
    return (
      amount - (balances.swapHive > balances.hive ? amount * WITHDRAWAL_FEE : 0)
    );
  }
  return null;
};

const getDepositEstimate = async (amount: number) => {
  const balances = await getBalances();
  if (balances.swapHive >= amount) {
    return (
      amount - (balances.hive > balances.swapHive ? amount * DEPOSIT_FEE : 0)
    );
  }
  return null;
};

export const DiscountedBridgeLogic = {
  getWithdrawalEstimate,
  getDepositEstimate,
};
