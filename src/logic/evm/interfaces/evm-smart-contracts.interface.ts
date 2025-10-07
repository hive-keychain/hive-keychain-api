export enum EVMSmartContractType {
  NATIVE = "NATIVE",
  ERC20 = "ERC20",
  ERC721 = "ERC721",
  ERC721Enumerable = "ERC721Enumerable",
  ERC1155 = "ERC1155",
}

export interface EvmSmartContractInfoBase {
  name: string;
  symbol: string;
  logo: string;
  chainId: string;
  backgroundColor: string;
  coingeckoId?: string;
  contractAddress?: string;
  // links: { [name: string]: string[] | string };
}

export interface EvmSmartContractInfoNative extends EvmSmartContractInfoBase {
  type: EVMSmartContractType.NATIVE;
  coingeckoId: string;
  createdAt: string;
  categories: string[];
}

export interface EvmSmartContractInfoErc20 extends EvmSmartContractInfoBase {
  type: EVMSmartContractType.ERC20;
  contractAddress: string;
  decimals: number;
  validated: number;
  possibleSpam: boolean;
  verifiedContract: boolean;
}

export interface EvmSmartContractInfoErc721 extends EvmSmartContractInfoBase {
  type: EVMSmartContractType;
  contractAddress: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
  name: string;
}
export interface EvmSmartContractInfoErc1155 extends EvmSmartContractInfoBase {
  type: EVMSmartContractType;
  contractAddress: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
  name: string;
}

export type EvmSmartContractInfo =
  | EvmSmartContractInfoErc20
  | EvmSmartContractInfoNative
  | EvmSmartContractInfoErc721
  | EvmSmartContractInfoErc1155;

export interface PopularToken {
  contractAddress: string;
  symbol: string;
  name: string;
  logo: string;
}

export interface SmartContractAddress {
  address: string;
  tokenId?: string;
}
