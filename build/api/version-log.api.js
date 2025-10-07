"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionLogApi = void 0;
const version_log_logic_1 = require("../logic/version-log.logic");
const access_middleware_1 = require("../middleware/access.middleware");
const setupGetLastExtensionVersion = (app) => {
    const getLastExtensionVersion = async (req, res) => {
        res.send(version_log_logic_1.VersionLogLogic.getLastExtensionVersion(version_log_logic_1.VersionType.EXTENSION));
    };
    app.get("/hive/last-extension-version", getLastExtensionVersion);
    app.get("/last-extension-version", getLastExtensionVersion);
};
const setupSetLastExtensionVersion = (app) => {
    const setLastExtensionVersion = async (req, res) => {
        try {
            await version_log_logic_1.VersionLogLogic.setLastExtensionVersion(req.body, version_log_logic_1.VersionType.EXTENSION);
            res.send({ status: 200, message: `Success` });
        }
        catch (err) {
            res.send({
                status: 500,
                message: `Error while saving: ${err.message}`,
            });
        }
    };
    app.post("/hive/set-last-extension-version", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), setLastExtensionVersion);
    app.post("/set-last-extension-version", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), setLastExtensionVersion);
};
const setupGetLastMobileVersion = (app) => {
    const getLastExtensionVersionMobile = async (req, res) => {
        res.send(version_log_logic_1.VersionLogLogic.getLastExtensionVersion(version_log_logic_1.VersionType.MOBILE));
    };
    app.get("/hive/last-version-mobile", getLastExtensionVersionMobile);
    app.get("/last-version-mobile", getLastExtensionVersionMobile);
};
const setupSetLastMobileVersion = (app) => {
    const setLastMobileVersion = async (req, res) => {
        try {
            await version_log_logic_1.VersionLogLogic.setLastExtensionVersion(req.body, version_log_logic_1.VersionType.MOBILE);
            res.send({ status: 200, message: `Success` });
        }
        catch (err) {
            res.send({
                status: 500,
                message: `Error while saving: ${err.message}`,
            });
        }
    };
    app.post("/hive/set-last-version-mobile", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), setLastMobileVersion);
    app.post("/set-last-version-mobile", (0, access_middleware_1.accessCheck)("ADMIN" /* Role.ADMIN */), setLastMobileVersion);
};
const setupApis = (app) => {
    setupGetLastExtensionVersion(app);
    setupSetLastExtensionVersion(app);
    setupGetLastMobileVersion(app);
    setupSetLastMobileVersion(app);
};
exports.VersionLogApi = {
    setupApis,
};
//# sourceMappingURL=version-log.api.js.map