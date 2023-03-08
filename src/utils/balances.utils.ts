import { Asset } from "@hiveio/dhive";
import { HiveEngineUtils } from "./hive-engine.utils";
import { HiveUtils } from "./hive.utils";

const getHiveBalance = async (username: string) => {
  const extendedAccount = (
    await HiveUtils.getClient().database.getAccounts([username])
  )[0];
  return Asset.from(extendedAccount.balance).amount;
};

const getSwapHiveBalance = async (username: string) => {
  const tokens: any[] = await HiveEngineUtils.get({
    contract: "tokens",
    table: "balances",
    query: { account: username },
    indexes: [],
    limit: 1000,
    offset: 0,
  });
  const swapHiveToken = tokens.find((t) => t.symbol === "SWAP.HIVE");
  if (!swapHiveToken) return 0;
  return Number(swapHiveToken.balance);
};

const getBalances = async (provider: string) => {
  const [hive, swapHive] = await Promise.all([
    BalancesUtils.getHiveBalance(provider),
    BalancesUtils.getSwapHiveBalance(provider),
  ]);
  return {
    hive,
    swapHive,
  };
};

export const BalancesUtils = {
  getHiveBalance,
  getSwapHiveBalance,
  getBalances,
};
