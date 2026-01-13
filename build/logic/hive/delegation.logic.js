"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationLogic = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const mssql_1 = __importDefault(require("mssql"));
const config_1 = require("../../config");
const getIncoming = async (username) => {
    const pool = new mssql_1.default.ConnectionPool(config_1.Config.hiveSql);
    return pool
        .connect()
        .then((pool) => {
        return pool
            .request()
            .input("username", username)
            .query(`SELECT delegator, vesting_shares, timestamp as delegation_date
            FROM TxDelegateVestingShares
            INNER JOIN (
              SELECT MAX(ID) as last_delegation_id
              FROM TxDelegateVestingShares
              WHERE delegatee = @username
              GROUP BY delegator
            ) AS Data ON TxDelegateVestingShares.ID = Data.last_delegation_id`);
    })
        .then((result) => {
        pool.close();
        return result.recordsets[0];
    })
        .catch((error) => {
        pool.close();
        logger_1.default.error(error);
        throw new Error(error);
    });
};
exports.DelegationLogic = {
    getIncoming,
};
//# sourceMappingURL=delegation.logic.js.map