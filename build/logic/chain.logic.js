"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainLogic = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// import { defaultChainList } from "./evm/data/chains.list";
const evm_chain_interfaces_1 = require("./evm/interfaces/evm-chain.interfaces");
const getChains = async () => {
    const chainsString = fs_1.default.readFileSync(path_1.default.join(__dirname, "..", "..", "json", "chains.json"), "utf8");
    const chains = JSON.parse(chainsString);
    return chains.filter((chain) => chain.active);
};
const getEvmChains = async () => {
    const chains = await getChains();
    return chains.filter((chain) => chain.type === evm_chain_interfaces_1.ChainType.EVM);
};
// const initChainList = async () => {
//   try {
//     fs.readFileSync(
//       path.join(__dirname, "..", "..", "json", "chains.json"),
//       "utf8"
//     );
//   } catch (err) {
//     Logger.info("Creating default chain list file");
//     fs.writeFileSync(
//       path.join(__dirname, "..", "..", "json", "chains.json"),
//       JSON.stringify(defaultChainList),
//       "utf8"
//     );
//   }
// };
exports.ChainLogic = {
    getChains,
    getEvmChains,
    // initChainList,
};
//# sourceMappingURL=chain.logic.js.map