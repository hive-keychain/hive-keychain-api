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
const chains_api_1 = require("./api/chains.api");
const ecosystem_api_1 = require("./api/ecosystem.api");
const gas_price_estimate_api_1 = require("./api/evm/gas-price-estimate.api");
const keychain_phishing_api_1 = require("./api/evm/keychain-phishing.api");
const lifi_api_1 = require("./api/evm/lifi.api");
const light_node_api_1 = require("./api/evm/light-node.api");
const verify_transaction_api_1 = require("./api/evm/verify-transaction.api");
const background_color_api_1 = require("./api/hive/background-color.api");
const bad_actors_api_1 = require("./api/hive/bad-actors.api");
const delegation_api_1 = require("./api/hive/delegation.api");
const historical_data_api_1 = require("./api/hive/historical-data.api");
const invoice_redirect_api_1 = require("./api/hive/invoice-redirect.api");
const rpc_api_1 = require("./api/hive/rpc.api");
const witness_api_1 = require("./api/hive/witness.api");
const mobile_settings_api_1 = require("./api/mobile-settings.api");
const price_api_1 = require("./api/price.api");
const swap_cryptos_api_1 = require("./api/swap-cryptos.api");
const version_log_api_1 = require("./api/version-log.api");
const config_1 = require("./config");
const coingecko_config_1 = require("./logic/evm/coingecko-config");
const lifi_logic_1 = require("./logic/evm/lifi.logic");
const smart_contract_info_logic_1 = require("./logic/evm/smart-contract-info.logic");
const metamask_phishing_logic_1 = require("./logic/evm/verify-transaction/phishing-list/metamask-phishing.logic");
const scamsniffer_logic_1 = require("./logic/evm/verify-transaction/scamsniffer.logic");
const historical_data_logic_1 = require("./logic/hive/historical-data.logic");
const token_background_color_1 = require("./logic/hive/token-background-color");
const price_logic_1 = require("./logic/price.logic");
var cors = require("cors");
const PORT = process.env.PORT || 3000;
const initServerRoutine = () => {
    const app = (0, express_1.default)();
    logger_1.default.initLogger(config_1.Config.logger, process.env.NODE_ENV || "development");
    setupRoutes(app);
    setTimeout(() => price_logic_1.PriceLogic.initFetchPrices(), 2 * 1000);
    historical_data_logic_1.HistoricalDataLogic.init();
    token_background_color_1.TokensBackgroundColorsLogic.initFetchColorMap();
    coingecko_config_1.CoingeckoConfigLogic.initFetchCoingeckoConfig();
    scamsniffer_logic_1.ScamSnifferLogic.initFetchScamSniffer();
    metamask_phishing_logic_1.MetamaskPhishingLogic.initFetchMetamaskBlacklist();
    smart_contract_info_logic_1.SmartContractsInfoLogic.initMoralisIfNeeded();
    // ChainLogic.initChainList();
    lifi_logic_1.LifiLogic.initializeLifi();
    startServer(app);
    // EvmPhishingLogic.verifyDomain("toto.com");
    // EvmPhishingLogic.verifyDomain("tata.com");
    // EvmPhishingLogic.verifyDomain("tati.com");
    // EvmPhishingLogic.verifyDomain("tataa.com");
    // EvmPhishingLogic.verifyDomain("jeanjaq.com");
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
    gas_price_estimate_api_1.GasPriceEstimateApi.setupApis(app);
    verify_transaction_api_1.VerifyTransactionApi.setupApis(app);
    mobile_settings_api_1.SettingsApi.setupApis(app);
    invoice_redirect_api_1.InvoiceRedirectApi.setupApis(app);
    keychain_phishing_api_1.KeychainPhishingApi.setupApis(app);
    swap_cryptos_api_1.SwapCryptosApi.setupApis(app);
    chains_api_1.ChainsApi.setupApis(app);
    lifi_api_1.LifiApi.setupApis(app);
    light_node_api_1.LightNodeApi.setupApis(app);
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