interface SmartContractMappingType {
  [chainId: string]: {
    [contractAddress: string]: string;
  };
  allChains: {
    [contractAddress: string]: string;
  };
}

const smartContractMapping: SmartContractMappingType = {
  allChains: {
    "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401": "ENS",
  },
};

export const getSmartContractMappingValue = (
  contractAddress: string,
  chainId: string
) => {
  console.log("getting", contractAddress, chainId);
  if (chainId) {
    if (
      smartContractMapping[chainId.toLowerCase()] &&
      smartContractMapping[chainId.toLowerCase()][contractAddress.toLowerCase()]
    ) {
      return smartContractMapping[chainId.toLowerCase()][
        contractAddress.toLowerCase()
      ];
    }
  }
  if (smartContractMapping.allChains) {
    return smartContractMapping.allChains[contractAddress.toLowerCase()];
  }
  return null;
};
