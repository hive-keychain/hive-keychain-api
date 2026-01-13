"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcosystemApi = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const ecosystem_logic_1 = require("../logic/ecosystem/ecosystem.logic");
const access_middleware_1 = require("../middleware/access.middleware");
const setupGetEcosystem = (app) => {
    app.get("/:chain/ecosystem/dapps", (0, express_validator_1.query)("chain").isString().not().isEmpty().escape(), async (req, res) => {
        const ecosystemDapps = await ecosystem_logic_1.EcosystemLogic.getDappList(req.params?.chain);
        logger_1.default.info(`Get ${req.params?.chain} ecosystem`);
        res.status(200).send(ecosystemDapps);
    });
};
const setupSaveNewDapp = (app) => {
    app.post("/:chain/ecosystem/new", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const newDapp = req.body;
        await ecosystem_logic_1.EcosystemLogic.saveNewDapp(newDapp, req.params.chain);
        logger_1.default.info(`Saving new ${req.params.chain} dapp`);
        res.status(200).send({ status: 200 });
    });
};
const setupEditDapp = (app) => {
    app.post("/:chain/ecosystem/edit", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const dapp = req.body;
        console.log("req.body", req.body);
        await ecosystem_logic_1.EcosystemLogic.editDapp(dapp, req.params.chain);
        logger_1.default.info(`Editing ${req.params.chain} dapp`);
        res.status(200).send({ status: 200 });
    });
};
const setupDeleteDapp = (app) => {
    app.post("/:chain/ecosystem/delete", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const dapp = req.body;
        console.log("req.body", req.body);
        await ecosystem_logic_1.EcosystemLogic.deleteDapp(dapp, req.params.chain);
        logger_1.default.info(`Deleting ${req.params.chain} dapp`);
        res.status(200).send({ status: 200 });
    });
};
const setupApis = (app) => {
    setupGetEcosystem(app);
    setupSaveNewDapp(app);
    setupEditDapp(app);
    setupDeleteDapp(app);
};
exports.EcosystemApi = { setupApis };
//# sourceMappingURL=ecosystem.api.js.map