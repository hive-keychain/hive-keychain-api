"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionLogApi = void 0;
var version_log_logic_1 = require("../logic/version-log.logic");
var setupGetLastExtensionVersion = function (app) {
    app.get("/hive/last-extension-version", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            res.send(version_log_logic_1.VersionLogLogic.getLastExtensionVersion());
            return [2 /*return*/];
        });
    }); });
};
var setupSetLastExtensionVersion = function (app) {
    app.put("/hive/set-last-extension-version", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (req.query["VERSION_PASSWORD"] !== process.env.VERSION_PASSWORD) {
                res.status(401).send("Unauthorized");
            }
            else {
                version_log_logic_1.VersionLogLogic.setLastExtensionVersion(req.body);
                res.send("OK");
            }
            return [2 /*return*/];
        });
    }); });
};
var setupGetLastExtensionVersionMobile = function (app) {
    app.get("/hive/last-version-mobile", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            res.send(version_log_logic_1.VersionLogLogic.getLastExtensionVersion(true));
            return [2 /*return*/];
        });
    }); });
};
var setupSetLastExtensionVersionMobile = function (app) {
    app.put("/hive/set-last-version-mobile", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (req.query["VERSION_PASSWORD"] !== process.env.VERSION_PASSWORD) {
                res.status(401).send("Unauthorized");
            }
            else {
                version_log_logic_1.VersionLogLogic.setLastExtensionVersion(req.body, true);
                res.send("OK");
            }
            return [2 /*return*/];
        });
    }); });
};
var setupApis = function (app) {
    setupGetLastExtensionVersion(app);
    setupSetLastExtensionVersion(app);
    setupGetLastExtensionVersionMobile(app);
    setupSetLastExtensionVersionMobile(app);
};
exports.VersionLogApi = {
    setupApis: setupApis,
};
//# sourceMappingURL=version-log.api.js.map