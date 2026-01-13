"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcApi = void 0;
const config_1 = require("../../config");
// RPC from env
const setupGetHiveRpcApi = (app) => {
    app.get("/hive/rpc", async (req, res) => {
        res.send({ rpc: config_1.Config.hive_rpc });
    });
};
const setupApis = (app) => {
    setupGetHiveRpcApi(app);
};
exports.RpcApi = {
    setupApis,
};
//# sourceMappingURL=rpc.api.js.map