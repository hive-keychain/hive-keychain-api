"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcosystemLogic = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const array_utils_1 = require("../../utils/array.utils");
const getDappList = (chain) => {
    const jsonString = fs_1.default.readFileSync(path_1.default.join(__dirname, `../../../json/${chain}-dapps.json`), "utf-8");
    const dapps = JSON.parse(jsonString);
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
const getOrderedDapps = (dApps) => {
    const withReferral = dApps.filter((e) => e.url.includes("?ref=")), withoutReferral = dApps.filter((e) => !e.url.includes("?ref="));
    return [
        ...array_utils_1.ArrayUtils.shuffle(withReferral),
        ...array_utils_1.ArrayUtils.shuffle(withoutReferral),
    ];
};
const saveNewDapp = (newDapp, chain) => {
    const jsonString = fs_1.default.readFileSync(path_1.default.join(__dirname, `../../../json/${chain}-dapps.json`), "utf-8");
    const dapps = JSON.parse(jsonString);
    const id = Math.max(...dapps.map((d) => d.id));
    dapps.push({ ...newDapp, id: id + 1 });
    fs_1.default.writeFileSync(path_1.default.join(__dirname, `../../../json/${chain}-dapps.json`), JSON.stringify(dapps));
};
const editDapp = (dapp, chain) => {
    const jsonString = fs_1.default.readFileSync(path_1.default.join(__dirname, `../../../json/${chain}-dapps.json`), "utf-8");
    const dapps = JSON.parse(jsonString).filter((d) => d.id !== dapp.id);
    dapps.push(dapp);
    try {
        fs_1.default.writeFileSync(path_1.default.join(__dirname, `../../../json/${chain}-dapps.json`), JSON.stringify(dapps));
    }
    catch (err) {
        console.log(err);
    }
};
const deleteDapp = (dapp, chain) => {
    const jsonString = fs_1.default.readFileSync(path_1.default.join(__dirname, `../../../json/${chain}-dapps.json`), "utf-8");
    const dapps = JSON.parse(jsonString).filter((d) => d.id !== dapp.id);
    try {
        fs_1.default.writeFileSync(path_1.default.join(__dirname, `../../../json/${chain}-dapps.json`), JSON.stringify(dapps));
    }
    catch (err) {
        console.log(err);
    }
};
exports.EcosystemLogic = {
    getDappList,
    saveNewDapp,
    editDapp,
    deleteDapp,
};
//# sourceMappingURL=ecosystem.logic.js.map