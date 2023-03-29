const SSC = require("@hive-engine/sscjs");
import { Asset, TransferOperation, utils as dHiveUtils } from "@hiveio/dhive";
import { operationOrders } from "@hiveio/dhive/lib/utils";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { Config } from "../../../config";
import { HiveUtils } from "../../../utils/hive.utils";
import { SwapsDataUtils } from "../../../utils/swaps-data.utils";

interface Transaction {
  amount: number;
  token: string;
  from: string;
  to: string;
  txId: string;
  memo: string;
}

const LIMIT = 1000;

const startLayer1Routine = async () => {
  const savedIndex = await SwapsDataUtils.getLayer1BlockInfo();
  let nextIndex = savedIndex;
  setInterval(
    async () => {
      const res = await fetchLayer1Transactions(nextIndex);
      SwapsDataUtils.saveLayer1BlockInfo(res.lastIndex);
      nextIndex = res.lastIndex;
      for (const transfer of res.transfersIn) {
        processLayer1Transaction(transfer);
      }
    },
    Config.swaps.fetchIntervalInSec * 1000,
    nextIndex
  );
};

const startLayer2Routine = async () => {
  fetchLayer2Transactions();
};

const processLayer1Transaction = (transaction: Transaction) => {
  // Logger.info(
  //   `Processing layer 1 transfer in from ${transaction.from}: ${transaction.amount} ${transaction.token}`
  // );
};

const processLayer2Transaction = (transaction: Transaction) => {
  // Logger.info(
  //   `Processing layer 2 tranfer in from ${transaction.from}: ${transaction.amount} ${transaction.token}`
  // );
};

const fetchLayer1Transactions = async (index?: number) => {
  const bitmask = dHiveUtils.makeBitMaskFilter([operationOrders.transfer]) as [
    number,
    number
  ];

  const res = await HiveUtils.getClient().database.getAccountHistory(
    Config.swaps.account,
    -1,
    LIMIT,
    bitmask
  );

  // console.log(res);

  const filteredTransactions = res.filter(
    (r) => (index && r[0] > index) || !index
  );

  let maxIndex = -1;
  for (const r of res) {
    if (maxIndex < r[0]) maxIndex = r[0];
  }

  const allTransactions = filteredTransactions.map((r) => {
    const transfer = r[1].op[1] as TransferOperation[1];
    return {
      amount: Asset.fromString(transfer.amount.toString()).amount,
      token: Asset.fromString(transfer.amount.toString()).symbol,
      from: transfer.from,
      to: transfer.to,
      memo: transfer.memo,
      txId: r[1].trx_id,
    } as Transaction;
  });

  console.log(`Layer 1 : ${allTransactions.length} new transactions to parse`);

  const transfersIn = allTransactions.filter(
    (transfer) => transfer.to === Config.swaps.account
  );

  return {
    lastIndex: maxIndex,
    transfersIn: transfersIn,
  };
};

const fetchLayer2Transactions = async (index?: number) => {
  const ssc = new SSC("https://engine.rishipanthee.com");
  // const ssc = new SSC("https://history.hive-engine.com");
  const savedBlockInfo = await SwapsDataUtils.getLayer2BlockInfo();
  console.log(savedBlockInfo);
  ssc.streamFromTo(savedBlockInfo ?? 26294213, null, (err, res) => {
    if (err) {
      Logger.error("Error while parsing Hive Engine blocks", err);
    } else {
      const allTransactions = res.transactions.filter((t) => {
        const payload = JSON.parse(t.payload);
        return (
          t.contract === "tokens" &&
          t.contractAction === "transfer" &&
          payload.to === Config.swaps.account
        );
      });

      const transactions = allTransactions.map((t) => {
        const payload = JSON.parse(t.payload);
        return {
          txId: t.transactionId,
          token: payload.symbol,
          to: payload.to,
          from: payload.from,
          amount: payload.quantity,
          memo: payload.memo,
        } as Transaction;
      });

      console.log(
        `${transactions.length} transactions to parse from layer 2 in block ${res.blockNumber}`
      );

      for (const t of transactions) {
        processLayer2Transaction(t);
      }

      SwapsDataUtils.saveLayer2BlockInfo(res.blockNumber);
    }
  });
};

export const TransactionsLogic = {
  startLayer1Routine,
  startLayer2Routine,
};
