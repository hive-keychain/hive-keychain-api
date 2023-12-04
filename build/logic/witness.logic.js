"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WitnessLogic = void 0;
var logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
var mssql_1 = __importDefault(require("mssql"));
var config_1 = require("../config");
var getWitness = function (username) {
    return new mssql_1.default.ConnectionPool(config_1.Config.hiveSql)
        .connect()
        .then(function (pool) {
        return pool
            .request()
            .input("username", username)
            .query("WITH Rewards (lastWeekValue, lastMonthValue, lastYearValue, allValue) AS \
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
            WHERE Witnesses.name = @username");
    })
        .then(function (result) {
        mssql_1.default.close();
        return result.recordsets[0][0];
    })
        .catch(function (error) {
        mssql_1.default.close();
        logger_1.default.error(error);
        return null;
    });
};
var getWitnessesRank = function () {
    return new mssql_1.default.ConnectionPool(config_1.Config.hiveSql)
        .connect()
        .then(function (pool) {
        return pool.request().query("SELECT Witnesses.name, rank,Witnesses.votes,Witnesses.votes_count\n          FROM Witnesses\n          INNER JOIN (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT votes) DESC) AS rank, name FROM Witnesses WHERE signing_key != 'STM1111111111111111111111111111111114T1Anm') AS rankedTable\n          ON Witnesses.name = rankedTable.name\n          ORDER BY rank;");
    })
        .then(function (result) {
        mssql_1.default.close();
        return result.recordsets[0];
    })
        .catch(function (error) {
        console.log(error);
        mssql_1.default.close();
    });
};
var getWitnessesRankV2 = function () {
    return new mssql_1.default.ConnectionPool(config_1.Config.hiveSql)
        .connect()
        .then(function (pool) {
        return pool.request().query("SELECT Witnesses.name, rank,Witnesses.votes,Witnesses.votes_count,Witnesses.signing_key,Witnesses.url\n          FROM Witnesses\n          INNER JOIN (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT votes) DESC) AS rank, name FROM Witnesses ) AS rankedTable\n          ON Witnesses.name = rankedTable.name\n          ORDER BY rank;");
    })
        .then(function (result) {
        mssql_1.default.close();
        var res = result.recordsets[0];
        var inactive = 0;
        for (var _i = 0, res_1 = res; _i < res_1.length; _i++) {
            var wit = res_1[_i];
            if (wit.signing_key === "STM1111111111111111111111111111111114T1Anm") {
                inactive++;
            }
            else {
                wit.active_rank = wit.rank - inactive;
            }
        }
        return res;
    })
        .catch(function (error) {
        mssql_1.default.close();
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
exports.WitnessLogic = {
    getWitness: getWitness,
    getWitnessesRank: getWitnessesRank,
    getWitnessesRankV2: getWitnessesRankV2,
};
//# sourceMappingURL=witness.logic.js.map