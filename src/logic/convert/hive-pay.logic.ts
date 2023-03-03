import { BalancesUtils } from "../../utils/balances.utils";

const HIVE_PAY_ACCOUNT = "uswap";
const WITHDRAWAL_FEE = 0.2;
const DEPOSIT_FEE = 0.2;
const MINIMUM_FEE = 0.001;

const getBalances = async () => {
  return {
    hive: await BalancesUtils.getHiveBalance(HIVE_PAY_ACCOUNT),
    swapHive: await BalancesUtils.getSwapHiveBalance(HIVE_PAY_ACCOUNT),
  };
};

const getWithdrawalEstimate = async (amount: number) => {
  const balances = await getBalances();
  if (balances.hive >= amount) {
    return amount - (Math.max(amount * WITHDRAWAL_FEE), MINIMUM_FEE);
  }
  return null;
};

const getDepositEstimate = async (amount: number) => {
  const balances = await getBalances();
  if (balances.swapHive >= amount) {
    return amount - (Math.max(amount * DEPOSIT_FEE), MINIMUM_FEE);
  }
  return null;
};

export const HivePayLogic = {
  getWithdrawalEstimate,
  getDepositEstimate,
};
