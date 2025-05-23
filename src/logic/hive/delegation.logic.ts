import Logger from "hive-keychain-commons/lib/logger/logger";
import sql from "mssql";
import { Config } from "../../config";

const getIncoming = async (username) => {
  const pool = new sql.ConnectionPool(Config.hiveSql);
  return pool
    .connect()
    .then((pool) => {
      return pool
        .request()
        .input("username", username)
        .query(
          `SELECT delegator, vesting_shares, timestamp as delegation_date
            FROM TxDelegateVestingShares
            INNER JOIN (
              SELECT MAX(ID) as last_delegation_id
              FROM TxDelegateVestingShares
              WHERE delegatee = @username
              GROUP BY delegator
            ) AS Data ON TxDelegateVestingShares.ID = Data.last_delegation_id`
        );
    })
    .then((result) => {
      pool.close();
      return result.recordsets[0];
    })
    .catch((error) => {
      pool.close();
      Logger.error(error);
      throw new Error(error);
    });
};

export const DelegationLogic = {
  getIncoming,
};
