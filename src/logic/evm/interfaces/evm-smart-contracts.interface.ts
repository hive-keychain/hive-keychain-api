export enum EVMSmartContractType {
  NATIVE = "NATIVE",
  ERC20 = "ERC-20",
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
  address: string;
  decimals: number;
  validated: number;
  possibleSpam: boolean;
  verifiedContract: boolean;
}

export interface EvmSmartContractInfoErc721 extends EvmSmartContractInfoBase {
  type: EVMSmartContractType;
  address: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
  name: string;
}
export interface EvmSmartContractInfoErc1155 extends EvmSmartContractInfoBase {
  type: EVMSmartContractType;
  address: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
  name: string;
}

export type EvmSmartContractInfo =
  | EvmSmartContractInfoErc20
  | EvmSmartContractInfoNative
  | EvmSmartContractInfoErc721
  | EvmSmartContractInfoErc1155;
