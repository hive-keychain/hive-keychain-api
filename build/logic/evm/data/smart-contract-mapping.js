"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmartContractMappingValue = void 0;
const smartContractMapping = {
    allChains: {
        "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401": "ENS",
    },
};
const getSmartContractMappingValue = (contractAddress, chainId) => {
    if (chainId) {
        if (smartContractMapping[chainId.toLowerCase()] &&
            smartContractMapping[chainId.toLowerCase()][contractAddress.toLowerCase()]) {
            return smartContractMapping[chainId.toLowerCase()][contractAddress.toLowerCase()];
        }
    }
    if (smartContractMapping.allChains) {
        return smartContractMapping.allChains[contractAddress.toLowerCase()];
    }
    return null;
};
exports.getSmartContractMappingValue = getSmartContractMappingValue;
//# sourceMappingURL=smart-contract-mapping.js.map