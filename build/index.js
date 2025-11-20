"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const https_1 = __importDefault(require("https"));
const ecosystem_api_1 = require("./api/ecosystem.api");
const background_color_api_1 = require("./api/hive/background-color.api");
const bad_actors_api_1 = require("./api/hive/bad-actors.api");
const delegation_api_1 = require("./api/hive/delegation.api");
const historical_data_api_1 = require("./api/hive/historical-data.api");
const invoice_redirect_api_1 = require("./api/hive/invoice-redirect.api");
const price_api_1 = require("./api/hive/price.api");
const rpc_api_1 = require("./api/hive/rpc.api");
const witness_api_1 = require("./api/hive/witness.api");
const mobile_settings_api_1 = require("./api/mobile-settings.api");
const swap_cryptos_api_1 = require("./api/swap-cryptos.api");
const version_log_api_1 = require("./api/version-log.api");
const config_1 = require("./config");
const historical_data_logic_1 = require("./logic/hive/historical-data.logic");
const price_logic_1 = require("./logic/hive/price.logic");
const token_background_color_1 = require("./logic/hive/token-background-color");
var cors = require("cors");
const PORT = process.env.PORT || 3000;
const initServerRoutine = () => {
    const app = (0, express_1.default)();
    logger_1.default.initLogger(config_1.Config.logger, process.env.NODE_ENV || "development");
    setupRoutes(app);
    price_logic_1.PriceLogic.initFetchPrices();
    historical_data_logic_1.HistoricalDataLogic.init();
    token_background_color_1.TokensBackgroundColorsLogic.initFetchColorMap();
    startServer(app);
};
const setupRoutes = (app) => {
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
    background_color_api_1.TokensBackgroundColorsApi.setupApis(app);
    ecosystem_api_1.EcosystemApi.setupApis(app);
    mobile_settings_api_1.SettingsApi.setupApis(app);
    invoice_redirect_api_1.InvoiceRedirectApi.setupApis(app);
    swap_cryptos_api_1.SwapCryptosApi.setupApis(app);
};
const startServer = (app) => {
    if (!process.env.DEV) {
        https_1.default
            .createServer({
            key: fs_1.default.readFileSync("/etc/letsencrypt/live/api.hive-keychain.com/privkey.pem", "utf8"),
            cert: fs_1.default.readFileSync("/etc/letsencrypt/live/api.hive-keychain.com/cert.pem", "utf8"),
            ca: fs_1.default.readFileSync("/etc/letsencrypt/live/api.hive-keychain.com/chain.pem", "utf8"),
        }, app)
            .listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    else {
        app.listen(PORT, () => {
            logger_1.default.technical(`Running on port ${PORT}`);
        });
    }
};
initServerRoutine();
//# sourceMappingURL=index.js.map