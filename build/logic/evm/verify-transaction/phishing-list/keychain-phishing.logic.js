"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeychainPhishingLogic = void 0;
const fs = __importStar(require("fs"));
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const path_1 = __importDefault(require("path"));
const getPhishingList = async () => {
    try {
        return JSON.parse(await fs
            .readFileSync(path_1.default.join(__dirname, "..", "..", "..", "..", "..", "json", "phishing-lists", "keychain.json"))
            .toString());
    }
    catch (e) {
        return {
            whitelist: [],
            blacklist: [],
            fuzzylist: [],
            version: 0,
            tolerance: 0,
        };
    }
};
const setLists = (newList) => {
    try {
        fs.writeFileSync(path_1.default.join(__dirname, "..", "..", "..", "..", "..", "json", "phishing-lists", "keychain.json"), JSON.stringify(newList), "utf8");
        logger_1.default.info(`Updated keychain file`);
    }
    catch (e) {
        logger_1.default.info("Failed to update keychain file");
        console.log(e);
    }
};
exports.KeychainPhishingLogic = {
    getPhishingList,
    setLists,
};
//# sourceMappingURL=keychain-phishing.logic.js.map