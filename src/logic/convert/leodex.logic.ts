import { BalancesUtils } from "../../utils/balances.utils";

const LEODEX_ACCOUNT = "leodex";
const WITHDRAWAL_FEE = 0.25;
const DEPOSIT_FEE = 0.25;

const getBalances = async () => {
  return {
    hive: await BalancesUtils.getHiveBalance(LEODEX_ACCOUNT),
    swapHive: await BalancesUtils.getSwapHiveBalance(LEODEX_ACCOUNT),
  };
};

const getWithdrawalEstimate = async (amount: number) => {
  const balances = await getBalances();
  if (balances.hive >= amount) {
    return amount - amount * WITHDRAWAL_FEE;
  }
  return null;
};

const getDepositEstimate = async (amount: number) => {
  const balances = await getBalances();
  if (balances.swapHive >= amount) {
    return amount - amount * DEPOSIT_FEE;
  }
  return null;
};

export const LeodexLogic = {
  getWithdrawalEstimate,
  getDepositEstimate,
};
