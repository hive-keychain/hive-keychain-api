export enum ChainType {
  HIVE = "HIVE",
  EVM = "EVM",
}

export enum EvmTransactionType {
  LEGACY = "0x0",
  EIP_155 = "0x1",
  EIP_1559 = "0x2",
  EIP_4844 = "0x3",
}

export type EvmMainToken = string;

export interface MultichainRpc {
  url: string;
  isDefault?: boolean;
}

export interface Chain {
  name: string;
  type?: ChainType;
  logo: string;
  chainId: string;
  testnet?: boolean;
  blockExplorer?: BlockExplorer;
  blockExplorerApi?: BlockExplorer;
  network?: string;
  rpcs: MultichainRpc[];
  isPopular?: boolean;
}

export enum BlockExplorerType {
  BLOCKSCOUT = "BLOCKSCOUT",
  ETHERSCAN = "ETHERSCAN",
  AVALANCHE_SCAN = "AVALANCHE_SCAN",
}

export interface BlockExplorer {
  url: string;
  type: BlockExplorerType;
}

export interface EvmChain extends Chain {
  type: ChainType.EVM;
  mainToken: EvmMainToken;
  providers?: EvmProviders;
  isEth?: boolean;
  defaultTransactionType: EvmTransactionType;
  onlyCustomFee?: boolean;
  addTokensManually?: boolean;
  disableTokensAndHistoryAutoLoading?: boolean;
  manualDiscoverAvailable?: boolean;
  openSeaChainId?: string;
}

export interface EvmProviders {}
