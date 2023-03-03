import { Asset, Client } from "@hiveio/dhive";
import { HiveEngineUtils } from "./hive-engine.utils";

let hiveClient: Client;

const getClient = () => {
  if (!hiveClient)
    hiveClient = new Client([
      "https://api.deathwing.me",
      "https://api.hive.blog",
    ]);
  return hiveClient;
};

const getHiveBalance = async (username: string) => {
  const extendedAccount = (
    await getClient().database.getAccounts([username])
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
  return Number(swapHiveToken);
};

export const BalancesUtils = {
  getHiveBalance,
  getSwapHiveBalance,
};
