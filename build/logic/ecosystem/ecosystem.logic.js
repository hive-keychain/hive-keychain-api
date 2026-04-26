"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcosystemLogic = void 0;
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const path_1 = __importDefault(require("path"));
const array_utils_1 = require("../../utils/array.utils");
/** Hive Keychain synthetic chain id for native Hive dapps. */
const HIVE_CHAIN_ID = "beeab0de00000000000000000000000000000000000000000000000000000000";
const ECOSYSTEM_DAPPS_PATH = path_1.default.join(__dirname, "../../../json/ecosystem/dapps.json");
const HIVE_DAPPS_JSON_PATHS = [
    path_1.default.join(__dirname, "../../../json/hive-dapps.json"),
    path_1.default.join(__dirname, "hive-dapps.json"),
];
const ensureDappsJsonFromHiveFallback = () => {
    if (fs_1.default.existsSync(ECOSYSTEM_DAPPS_PATH)) {
        return;
    }
    const hivePath = HIVE_DAPPS_JSON_PATHS.find((p) => fs_1.default.existsSync(p));
    if (!hivePath) {
        return;
    }
    const raw = fs_1.default.readFileSync(hivePath, "utf-8");
    const items = JSON.parse(raw);
    const withChain = items.map((item) => ({
        ...item,
        chainId: HIVE_CHAIN_ID,
    }));
    fs_1.default.mkdirSync(path_1.default.dirname(ECOSYSTEM_DAPPS_PATH), { recursive: true });
    fs_1.default.writeFileSync(ECOSYSTEM_DAPPS_PATH, JSON.stringify(withChain, null, 2));
};
const readAllDapps = () => {
    ensureDappsJsonFromHiveFallback();
    const jsonString = fs_1.default.readFileSync(ECOSYSTEM_DAPPS_PATH, "utf-8");
    return JSON.parse(jsonString);
};
const writeAllDapps = (dapps) => {
    fs_1.default.writeFileSync(ECOSYSTEM_DAPPS_PATH, JSON.stringify(dapps, null, 2));
};
const buildEcosystem = (dapps) => {
    let categories = [];
    for (const item of dapps) {
        categories = array_utils_1.ArrayUtils.mergeWithoutDuplicate(item.categories, categories);
    }
    const ecosystem = [];
    for (const cat of categories) {
        ecosystem.push({
            category: cat,
            dapps: getOrderedDapps(dapps.filter((dapp) => dapp.categories.includes(cat))),
        });
    }
    return ecosystem;
};
const getDappList = () => {
    try {
        const dapps = readAllDapps();
        return buildEcosystem(dapps);
    }
    catch (err) {
        logger_1.default.error(`Error while getting dapps list: ${err}`);
        return [];
    }
};
const getDappListByChainId = (chainId) => {
    try {
        const dapps = readAllDapps().filter((dapp) => dapp.chainId === chainId);
        return buildEcosystem(dapps);
    }
    catch (err) {
        logger_1.default.error(`Error while getting dapps list: ${err}`);
        return [];
    }
};
const getOrderedDapps = (dApps) => {
    const withReferral = dApps.filter((e) => e.url.includes("?ref=")), withoutReferral = dApps.filter((e) => !e.url.includes("?ref="));
    return [
        ...array_utils_1.ArrayUtils.shuffle(withReferral),
        ...array_utils_1.ArrayUtils.shuffle(withoutReferral),
    ];
};
const saveNewDapp = (newDapp) => {
    const chainId = newDapp?.chainId;
    if (!chainId) {
        logger_1.default.error("Missing chainId while saving new dapp");
        return;
    }
    const dapps = readAllDapps();
    const chainDapps = dapps.filter((dapp) => dapp.chainId === chainId);
    const id = chainDapps.length
        ? Math.max(...chainDapps.map((d) => d.id))
        : -1;
    dapps.push({ ...newDapp, chainId, id: id + 1 });
    writeAllDapps(dapps);
};
const editDapp = (dapp) => {
    const chainId = dapp?.chainId;
    if (!chainId) {
        logger_1.default.error("Missing chainId while editing dapp");
        return;
    }
    const dapps = readAllDapps().filter((d) => !(d.id === dapp.id && d.chainId === chainId));
    dapps.push({ ...dapp, chainId });
    try {
        writeAllDapps(dapps);
    }
    catch (err) {
        console.log({ err });
    }
};
const deleteDapp = (dapp) => {
    const chainId = dapp?.chainId;
    if (!chainId) {
        logger_1.default.error("Missing chainId while deleting dapp");
        return;
    }
    const dapps = readAllDapps().filter((d) => !(d.id === dapp.id && d.chainId === chainId));
    try {
        writeAllDapps(dapps);
    }
    catch (err) {
        console.log(err);
    }
};
exports.EcosystemLogic = {
    getDappList,
    getDappListByChainId,
    saveNewDapp,
    editDapp,
    deleteDapp,
};
//# sourceMappingURL=ecosystem.logic.js.map