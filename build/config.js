"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
var path_1 = __importDefault(require("path"));
require("dotenv").config();
exports.Config = {
    hiveSql: {
        user: process.env.LOGIN,
        password: process.env.PASSWORD,
        server: process.env.SQL_API,
        database: process.env.DB,
        requestTimeout: 60000,
    },
    rpc: process.env.RPC,
    hive_rpc: process.env.HIVE_RPC,
    logger: {
        folder: path_1.default.join(__dirname, "..", "logs"),
        file: "lease-market-%DATE%.log",
        levels: {
            TECHNICAL: 1,
            INFO: 1,
            ERROR: 0,
            OPERATION: 1,
            DEBUG: 1,
            WARN: 1,
        },
    },
};
//# sourceMappingURL=config.js.map