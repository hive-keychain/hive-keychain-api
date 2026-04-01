"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcosystemApi = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const ecosystem_logic_1 = require("../logic/ecosystem/ecosystem.logic");
const access_middleware_1 = require("../middleware/access.middleware");
const setupGetEcosystem = (app) => {
    app.get("/ecosystem/dapps", async (req, res) => {
        const ecosystemDapps = await ecosystem_logic_1.EcosystemLogic.getDappList();
        logger_1.default.info("Get ecosystem");
        res.status(200).send(ecosystemDapps);
    });
};
const setupLegacyGetEcosystem = (app) => {
    app.get("/:chain/ecosystem/dapps", async (req, res) => {
        const ecosystemDapps = await ecosystem_logic_1.EcosystemLogic.getDappListByChainId(req.params.chain);
        logger_1.default.info(`Get ${req.params.chain} ecosystem (legacy)`);
        res.status(200).send(ecosystemDapps);
    });
};
const setupSaveNewDapp = (app) => {
    app.post("/ecosystem/new", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const newDapp = req.body;
        await ecosystem_logic_1.EcosystemLogic.saveNewDapp(newDapp);
        logger_1.default.info(`Saving new ${req.body?.chainId} dapp`);
        res.status(200).send({ status: 200 });
    });
};
const setupLegacySaveNewDapp = (app) => {
    app.post("/:chain/ecosystem/new", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const newDapp = { ...req.body, chainId: req.params.chain };
        await ecosystem_logic_1.EcosystemLogic.saveNewDapp(newDapp);
        logger_1.default.info(`Saving new ${req.params.chain} dapp (legacy)`);
        res.status(200).send({ status: 200 });
    });
};
const setupEditDapp = (app) => {
    app.post("/ecosystem/edit", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const dapp = req.body;
        await ecosystem_logic_1.EcosystemLogic.editDapp(dapp);
        logger_1.default.info(`Editing ${req.body?.chainId} dapp`);
        res.status(200).send({ status: 200 });
    });
};
const setupLegacyEditDapp = (app) => {
    app.post("/:chain/ecosystem/edit", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const dapp = { ...req.body, chainId: req.params.chain };
        await ecosystem_logic_1.EcosystemLogic.editDapp(dapp);
        logger_1.default.info(`Editing ${req.params.chain} dapp (legacy)`);
        res.status(200).send({ status: 200 });
    });
};
const setupDeleteDapp = (app) => {
    app.post("/ecosystem/delete", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const dapp = req.body;
        await ecosystem_logic_1.EcosystemLogic.deleteDapp(dapp);
        logger_1.default.info(`Deleting ${req.body?.chainId} dapp`);
        res.status(200).send({ status: 200 });
    });
};
const setupLegacyDeleteDapp = (app) => {
    app.post("/:chain/ecosystem/delete", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const dapp = { ...req.body, chainId: req.params.chain };
        await ecosystem_logic_1.EcosystemLogic.deleteDapp(dapp);
        logger_1.default.info(`Deleting ${req.params.chain} dapp (legacy)`);
        res.status(200).send({ status: 200 });
    });
};
const setupApis = (app) => {
    setupGetEcosystem(app);
    setupLegacyGetEcosystem(app);
    setupSaveNewDapp(app);
    setupLegacySaveNewDapp(app);
    setupEditDapp(app);
    setupLegacyEditDapp(app);
    setupDeleteDapp(app);
    setupLegacyDeleteDapp(app);
};
exports.EcosystemApi = { setupApis };
//# sourceMappingURL=ecosystem.api.js.map