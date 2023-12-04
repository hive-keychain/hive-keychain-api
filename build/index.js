"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
var body_parser_1 = __importDefault(require("body-parser"));
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
var https_1 = __importDefault(require("https"));
var bad_actors_api_1 = require("./api/bad-actors.api");
var delegation_api_1 = require("./api/delegation.api");
var historical_data_api_1 = require("./api/historical-data.api");
var price_api_1 = require("./api/price.api");
var rpc_api_1 = require("./api/rpc.api");
var version_log_api_1 = require("./api/version-log.api");
var witness_api_1 = require("./api/witness.api");
var config_1 = require("./config");
var historical_data_logic_1 = require("./logic/historical-data.logic");
var price_logic_1 = require("./logic/price.logic");
var cors = require("cors");
var PORT = process.env.PORT || 3000;
var initServerRoutine = function () {
    var app = (0, express_1.default)();
    logger_1.default.initLogger(config_1.Config.logger, process.env.NODE_ENV);
    setupRoutes(app);
    price_logic_1.PriceLogic.initFetchPrices();
    historical_data_logic_1.HistoricalDataLogic.init();
    startServer(app);
};
var setupRoutes = function (app) {
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: false }));
    app.use(express_1.default.static("public", { dotfiles: "allow" }));
    //CORS
    app.use(cors());
    bad_actors_api_1.BadActorsApi.setupApis(app);
    delegation_api_1.DelegationApi.setupApis(app);
    price_api_1.PriceApi.setupApis(app);
    historical_data_api_1.HistoricalDataApi.setupApis(app);
    rpc_api_1.RpcApi.setupApis(app);
    version_log_api_1.VersionLogApi.setupApis(app);
    witness_api_1.WitnessApi.setupApis(app);
};
var startServer = function (app) {
    if (!process.env.DEV) {
        https_1.default
            .createServer({
            key: fs_1.default.readFileSync("/etc/letsencrypt/live/api.hive-keychain.com/privkey.pem", "utf8"),
            cert: fs_1.default.readFileSync("/etc/letsencrypt/live/api.hive-keychain.com/cert.pem", "utf8"),
            ca: fs_1.default.readFileSync("/etc/letsencrypt/live/api.hive-keychain.com/chain.pem", "utf8"),
        }, app)
            .listen(PORT, function () {
            console.log("Server running on port ".concat(PORT));
        });
    }
    else {
        app.listen(PORT, function () {
            logger_1.default.technical("Running on port ".concat(PORT));
        });
    }
};
initServerRoutine();
//# sourceMappingURL=index.js.map