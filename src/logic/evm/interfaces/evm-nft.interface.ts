import {
  EvmSmartContractInfoErc1155,
  EvmSmartContractInfoErc721,
} from "./evm-smart-contracts.interface";

export interface EvmNFTMetadataAttribute {
  trait_type: string;
  value: string;
}

export interface EvmNFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: EvmNFTMetadataAttribute[];
}

export interface EvmErc721TokenCollectionItem {
  id: string;
  metadata: EvmNFTMetadata;
}

export interface EvmErc1155TokenCollectionItem {
  id: string;
  balance: number;
  metadata: EvmNFTMetadata;
}

export interface EvmErc721Token {
  tokenInfo: EvmSmartContractInfoErc721;
  collection: EvmErc721TokenCollectionItem[];
}

export interface EvmErc1155Token {
  tokenInfo: EvmSmartContractInfoErc1155;
  collection: EvmErc1155TokenCollectionItem[];
}
