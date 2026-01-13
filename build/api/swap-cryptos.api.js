"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapCryptosApi = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const swap_crypto_logic_1 = require("../logic/swap-crypto.logic");
const setupApis = (app) => {
    app.get("/swap-cryptos/currencies", async (req, res) => {
        const currencyOptions = await swap_crypto_logic_1.SwapCryptoLogic.getCurrencyOptions();
        logger_1.default.info(`Get swap cryptos currencies`);
        res.status(200).send(currencyOptions);
    });
    app.get("/swap-cryptos/range/:tokenFrom/:networkFrom/:tokenTo/:networkTo", (0, express_validator_1.query)("tokenFrom").isString().not().isEmpty().escape(), (0, express_validator_1.query)("networkFrom").isString().not().isEmpty().escape(), (0, express_validator_1.query)("tokenTo").isString().not().isEmpty().escape(), (0, express_validator_1.query)("networkTo").isString().not().isEmpty().escape(), async (req, res) => {
        const currencyRange = await swap_crypto_logic_1.SwapCryptoLogic.getRange(req.params.tokenFrom, req.params.networkFrom, req.params.tokenTo, req.params.networkTo);
        logger_1.default.info(`Get swap cryptos range`);
        res.status(200).send(currencyRange);
    });
    app.get("/swap-cryptos/estimate/:amount/:tokenFrom/:networkFrom/:tokenTo/:networkTo", (0, express_validator_1.query)("tokenFrom").isString().not().isEmpty().escape(), (0, express_validator_1.query)("networkFrom").isString().not().isEmpty().escape(), (0, express_validator_1.query)("tokenTo").isString().not().isEmpty().escape(), (0, express_validator_1.query)("networkTo").isString().not().isEmpty().escape(), (0, express_validator_1.query)("amount").isString().not().isEmpty().escape(), async (req, res) => {
        const estimation = await swap_crypto_logic_1.SwapCryptoLogic.getExchangeEstimation(req.params.amount, req.params.tokenFrom, req.params.networkFrom, req.params.tokenTo, req.params.networkTo);
        logger_1.default.info(`Get swap cryptos estimation`);
        res.status(200).send(estimation);
    });
};
exports.SwapCryptosApi = { setupApis };
//# sourceMappingURL=swap-cryptos.api.js.map