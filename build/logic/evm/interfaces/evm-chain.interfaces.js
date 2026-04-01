"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockExplorerType = exports.EvmTransactionType = exports.ChainType = void 0;
var ChainType;
(function (ChainType) {
    ChainType["HIVE"] = "HIVE";
    ChainType["EVM"] = "EVM";
})(ChainType || (exports.ChainType = ChainType = {}));
var EvmTransactionType;
(function (EvmTransactionType) {
    EvmTransactionType["LEGACY"] = "0x0";
    EvmTransactionType["EIP_155"] = "0x1";
    EvmTransactionType["EIP_1559"] = "0x2";
    EvmTransactionType["EIP_4844"] = "0x3";
})(EvmTransactionType || (exports.EvmTransactionType = EvmTransactionType = {}));
var BlockExplorerType;
(function (BlockExplorerType) {
    BlockExplorerType["BLOCKSCOUT"] = "BLOCKSCOUT";
    BlockExplorerType["ETHERSCAN"] = "ETHERSCAN";
    BlockExplorerType["AVALANCHE_SCAN"] = "AVALANCHE_SCAN";
})(BlockExplorerType || (exports.BlockExplorerType = BlockExplorerType = {}));
//# sourceMappingURL=evm-chain.interfaces.js.map