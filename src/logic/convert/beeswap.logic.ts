import { BalancesUtils } from "../../utils/balances.utils";

const BEESWAP_ACCOUNT = "hiveswap";
const WITHDRAWAL_FEE = 0.25;
const DEPOSIT_FEE = 0.25;

const getBalances = async () => {
  return {
    hive: await BalancesUtils.getHiveBalance(BEESWAP_ACCOUNT),
    swapHive: await BalancesUtils.getSwapHiveBalance(BEESWAP_ACCOUNT),
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

export const BeeswapLogic = {
  getWithdrawalEstimate,
  getDepositEstimate,
};
