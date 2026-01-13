"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsApi = void 0;
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const mobile_settings_logic_1 = require("../logic/mobile-settings.logic");
const access_middleware_1 = require("../middleware/access.middleware");
const setupGetMobileSettings = (app) => {
    app.get("/mobile-settings", async (req, res) => {
        const settings = await mobile_settings_logic_1.MobileSettingsLogic.getSettings();
        logger_1.default.info(`Get mobile settings`);
        res.status(200).send(settings);
    });
};
const setupEditMobileSettings = (app) => {
    app.post("/mobile-settings/edit", (0, access_middleware_1.accessCheck)("TEAM" /* Role.TEAM */), async (req, res) => {
        const newSettings = req.body;
        await mobile_settings_logic_1.MobileSettingsLogic.editSettings(newSettings);
        logger_1.default.info(`Editing mobile settings`);
        res.status(200).send({ status: 200 });
    });
};
const setupApis = (app) => {
    setupGetMobileSettings(app);
    setupEditMobileSettings(app);
};
exports.SettingsApi = { setupApis };
//# sourceMappingURL=mobile-settings.api.js.map