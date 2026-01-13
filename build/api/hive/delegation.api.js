"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegationApi = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const delegation_logic_1 = require("../../logic/hive/delegation.logic");
const setupGetIncomingDelegations = (app) => {
    app.get("/hive/delegators/:username", (0, express_validator_1.query)("username").isString().not().isEmpty().escape(), async function (req, res) {
        try {
            logger_1.default.debug(`Getting delegators for ${req.params?.username}`);
            const resp = await delegation_logic_1.DelegationLogic.getIncoming(req.params?.username);
            res.status(200).send(resp);
        }
        catch (e) {
            res.status(500).send(e);
        }
    });
};
const setupApis = (app) => {
    setupGetIncomingDelegations(app);
};
exports.DelegationApi = { setupApis };
//# sourceMappingURL=delegation.api.js.map