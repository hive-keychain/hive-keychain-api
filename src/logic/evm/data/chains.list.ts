export const defaultChainList = [
  {
    name: "Ethereum",
    chainId: "0x1",
    mainToken: "ETH",
    blockExplorer: {
      url: "https://etherscan.io",
    },
    blockExplorerApi: {
      // url: 'https://api.etherscan.io',
      url: "https://eth.blockscout.com",
    },
    isEth: true,
    rpc: [
      { url: "https://ethereum-rpc.publicnode.com" },
      { url: "https://eth.drpc.org" },
    ],
  },
  {
    name: "Avalanche",
    chainId: "0xa86a",
    mainToken: "AVAX",
    network: "avalanche-mainnet",
    blockExplorer: {
      url: "https://snowscan.xyz",
    },
    blockExplorerApi: {
      url: "https://api.snowscan.xyz",
    },
    rpc: [
      { url: "https://avalanche-c-chain-rpc.publicnode.com" },
      { url: "https://avalanche.drpc.org" },
    ],
  },
  {
    name: "BNB",
    chainId: "0x38",
    mainToken: "BNB",
    network: "bnb",
    blockExplorer: {
      url: "https://bscscan.com",
    },
    blockExplorerApi: {
      url: "https://api.bscscan.com",
    },
    rpc: [
      { url: "https://bsc-rpc.publicnode.com" },
      { url: "https://bsc.drpc.org" },
    ],
  },
  {
    name: "Polygon",
    chainId: "0x89",
    mainToken: "MATIC",
    network: "matic",
    blockExplorer: {
      url: "https://polygonscan.com",
    },
    blockExplorerApi: {
      // url: 'https://api.polygonscan.com',
      url: "https://polygon.blockscout.com",
    },
    rpc: [
      { url: "https://polygon-bor-rpc.publicnode.com" },
      { url: "https://polygon.drpc.org" },
    ],
  },
  {
    name: "Sepolia",
    chainId: "0xAA36A7",
    mainToken: "SepoliaEth",
    network: "sepolia",
    blockExplorer: {
      url: "https://sepolia.etherscan.io",
    },
    blockExplorerApi: {
      // url: 'https://api-sepolia.etherscan.io',
      url: "https://eth-sepolia.blockscout.com",
    },
    testnet: true,
    isEth: true,
    rpc: [
      { url: "https://sepolia.drpc.org" },
      { url: "https://ethereum-sepolia-rpc.publicnode.com" },
    ],
  },
] as any[];
