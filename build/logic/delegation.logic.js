"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationLogic = void 0;
var logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
var mssql_1 = __importDefault(require("mssql"));
var config_1 = require("../config");
var getIncoming = function (username) {
    return new mssql_1.default.ConnectionPool(config_1.Config.hiveSql)
        .connect()
        .then(function (pool) {
        return pool
            .request()
            .input("username", username)
            .query("SELECT delegator, vesting_shares, timestamp as delegation_date\n            FROM TxDelegateVestingShares\n            INNER JOIN (\n              SELECT MAX(ID) as last_delegation_id\n              FROM TxDelegateVestingShares\n              WHERE delegatee = @username\n              GROUP BY delegator\n            ) AS Data ON TxDelegateVestingShares.ID = Data.last_delegation_id");
    })
        .then(function (result) {
        mssql_1.default.close();
        return result.recordsets[0];
    })
        .catch(function (error) {
        mssql_1.default.close();
        logger_1.default.error(error);
        throw new Error(error);
    });
};
exports.DelegationLogic = {
    getIncoming: getIncoming,
};
//# sourceMappingURL=delegation.logic.js.map