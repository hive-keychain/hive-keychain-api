"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceRedirectApi = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const setupApis = (app) => {
    app.get("/hive/invoice/:op", (0, express_validator_1.query)("op").isString().not().isEmpty().escape(), async function (req, res) {
        try {
            logger_1.default.debug(`Redirecting to ${req.params?.op}`);
            res
                .status(302)
                .redirect(`hive://sign/op/${req.params?.op}`);
        }
        catch (e) {
            console.log("here");
            res.status(500).send(e);
        }
    });
};
exports.InvoiceRedirectApi = {
    setupApis,
};
//# sourceMappingURL=invoice-redirect.api.js.map