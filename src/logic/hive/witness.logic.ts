import Logger from "hive-keychain-commons/lib/logger/logger";
import sql from "mssql";
import { Config } from "../../config";

const getWitness = async function (username) {
  const pool = new sql.ConnectionPool(Config.hiveSql);
  return pool
    .connect()
    .then((pool) => {
      return pool.request().input("username", username).query(
        "WITH Rewards (lastWeekValue, lastMonthValue, lastYearValue, allValue) AS \
           ( SELECT \
                SUM(IIF(timestamp >= DATEADD(day,-7, GETUTCDATE()),vesting_shares,0)) AS lastWeekValue, \
                SUM(IIF(timestamp >= DATEADD(day,-31, GETUTCDATE()),vesting_shares,0)) AS lastMonthValue, \
                SUM(IIF(timestamp >= DATEADD(day,-365, GETUTCDATE()),vesting_shares,0)) AS lastYearValue, \
                SUM(IIF(timestamp >= DATEADD(day,-7, GETUTCDATE()),vesting_shares,0)) AS allValue \
             FROM VOProducerRewards \
             WHERE producer = @username \
            ) \
            SELECT Rewards.*, Blocks.timestamp, Witnesses.* \
            FROM Rewards, Witnesses \
            LEFT JOIN Blocks ON Witnesses.last_confirmed_block_num = Blocks.block_num \
            WHERE Witnesses.name = @username"
      );
    })
    .then((result) => {
      pool.close();
      return result.recordsets[0][0];
    })
    .catch((error) => {
      pool.close();
      Logger.error(error);
      return null;
    });
};

const getWitnessesRank = function () {
  const pool = new sql.ConnectionPool(Config.hiveSql);
  return pool
    .connect()
    .then((pool) => {
      return pool.request().query(
        `SELECT Witnesses.name, rank,Witnesses.votes,Witnesses.votes_count
          FROM Witnesses
          INNER JOIN (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT votes) DESC) AS rank, name FROM Witnesses WHERE signing_key != 'STM1111111111111111111111111111111114T1Anm') AS rankedTable
          ON Witnesses.name = rankedTable.name
          ORDER BY rank;`
      );
    })
    .then((result) => {
      pool.close();
      return result.recordsets[0];
    })
    .catch((error) => {
      pool.close();
      Logger.error(error);
    });
};

const getWitnessesRankV2 = function () {
  const pool = new sql.ConnectionPool(Config.hiveSql);
  return pool
    .connect()
    .then((pool) => {
      return pool.request().query(
        `SELECT Witnesses.name, rank,Witnesses.votes,Witnesses.votes_count,Witnesses.signing_key,Witnesses.url
          FROM Witnesses
          INNER JOIN (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT votes) DESC) AS rank, name FROM Witnesses ) AS rankedTable
          ON Witnesses.name = rankedTable.name
          ORDER BY rank;`
      );
    })
    .then((result) => {
      pool.close();
      const res = result.recordsets[0];
      let inactive = 0;
      for (const wit of res) {
        if (wit.signing_key === "STM1111111111111111111111111111111114T1Anm") {
          inactive++;
        } else {
          wit.active_rank = wit.rank - inactive;
        }
      }
      return res;
    })
    .catch((error) => {
      pool.close();
      throw new Error(error);
    });
};

// exports.getReceivedVotes = function(username) {
//   return new sql.ConnectionPool(config.config_api)
//     .connect()
//     .then(pool => {
//       console.log("connected");
//       return pool
//         .request()
//         .input("username", username)
//         .query(
//           "SELECT \
//             name AS [account], \
//             CONVERT(bigint,vesting_shares) + (CONVERT(bigint,JSON_VALUE(proxied_vsf_votes,'$[0]'))/1000000) AS totalVests, \
//             CONVERT(bigint,vesting_shares) AS accountVests, \
//             CONVERT(bigint,JSON_VALUE(proxied_vsf_votes,'$[0]'))/1000000 AS proxiedvests \
//           FROM Accounts \
//           WHERE witness_votes LIKE '%@" +
//             username +
//             "%' \
//           ORDER BY CONVERT(bigint,vesting_shares) + (CONVERT(bigint,JSON_VALUE(proxied_vsf_votes,'$[0]'))/1000000) DESC"
//         );
//     })
//     .then(result => {
//       sql.close();
//       return result.recordsets[0];
//     })
//     .catch(error => {
//       console.log(error);
//       sql.close();
//     });
// };

export const WitnessLogic = {
  getWitness,
  getWitnessesRank,
  getWitnessesRankV2,
};
