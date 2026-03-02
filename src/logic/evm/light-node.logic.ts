import { BaseApi } from "../../utils/base";
import { getSmartContractMappingValue } from "./data/smart-contract-mapping";
import {
  EvmErc1155Token,
  EvmErc721Token,
  EvmNFTMetadata,
} from "./interfaces/evm-nft.interface";
import { EVMSmartContractType } from "./interfaces/evm-smart-contracts.interface";
import { SmartContractsInfoLogic } from "./smart-contract-info.logic";

const getLightNodeBaseUrl = () => {
  const baseUrl = process.env.EVM_LIGHT_NODE_API_URL;

  if (!baseUrl) {
    throw new Error(
      "Missing EVM light node base URL. Set EVM_LIGHT_NODE_URL or EVM_LIGHT_NODE_API_URL.",
    );
  }

  return baseUrl.replace(/\/+$/, "");
};

const buildUrl = (path: string) => `${getLightNodeBaseUrl()}${path}`;

type LightNodeNftContractType = "ERC721" | "ERC1155" | "UNKNOWN";

interface LightNodeNftItem {
  tokenId: string;
  balance: string;
  name: string | null;
  imageUrl: string | null;
}

interface LightNodeNftCollection {
  contractAddress: string;
  contractType: LightNodeNftContractType;
  name: string | null;
  symbol: string | null;
  verifiedContract: boolean;
  possibleSpam: boolean;
  nfts: LightNodeNftItem[];
}

const getDiscoveredTokens = async <T = any>(
  chainId: string,
  address: string,
  isNew?: boolean | string,
): Promise<T[]> => {
  const newSegment =
    typeof isNew === "undefined" ? "" : `/${encodeURIComponent(String(isNew))}`;

  const tokens: any[] = await BaseApi.get(
    buildUrl(
      `/discovery/tokens/${encodeURIComponent(chainId)}/${encodeURIComponent(
        address,
      )}${newSegment}`,
    ),
  );
  const nativeToken =
    await SmartContractsInfoLogic.getNativeTokenFromCoingecko(chainId);
  console.log("native token", nativeToken);
  tokens.unshift(nativeToken);

  return tokens;
};

const getDiscoveredNfts = async (
  chainId: string,
  address: string,
): Promise<(EvmErc721Token | EvmErc1155Token)[]> => {
  const results = (await BaseApi.get(
    buildUrl(
      `/discovery/nfts/${encodeURIComponent(chainId)}/${encodeURIComponent(
        address,
      )}`,
    ),
  )) as LightNodeNftCollection[];
  const collections = Array.isArray(results) ? results : [];

  const toMetadata = (item: LightNodeNftItem): EvmNFTMetadata => ({
    name: item.name ?? "",
    description: "",
    image: item.imageUrl ?? "",
    attributes: [],
  });

  return collections
    .filter(
      (result) =>
        result.contractType === EVMSmartContractType.ERC721 ||
        result.contractType === EVMSmartContractType.ERC1155,
    )
    .map((result) => {
      const mappedName = getSmartContractMappingValue(
        result.contractAddress,
        chainId,
      );
      const baseTokenInfo = {
        contractAddress: result.contractAddress,
        possibleSpam: result.possibleSpam === true,
        verifiedContract: result.verifiedContract === true,
        name:
          mappedName ?? result.name ?? result.symbol ?? result.contractAddress,
        symbol: result.symbol ?? "",
        chainId,
        logo: "",
        backgroundColor: "",
      };

      if (result.contractType === EVMSmartContractType.ERC1155) {
        return {
          tokenInfo: {
            ...baseTokenInfo,
            type: EVMSmartContractType.ERC1155,
          },
          collection: (result.nfts ?? []).map((item) => ({
            id: item.tokenId,
            balance: Number(item.balance) || 0,
            metadata: toMetadata(item),
          })),
        } as EvmErc1155Token;
      }

      return {
        tokenInfo: {
          ...baseTokenInfo,
          type: EVMSmartContractType.ERC721,
        },
        collection: (result.nfts ?? []).map((item) => ({
          id: item.tokenId,
          metadata: toMetadata(item),
        })),
      } as EvmErc721Token;
    });
};

const getNftDetail = async <T = any>(
  chainId: string,
  nftId: string,
): Promise<T> => {
  return BaseApi.get(
    buildUrl(
      `/nft/detail/${encodeURIComponent(chainId)}/${encodeURIComponent(nftId)}`,
    ),
  );
};

const getHistory = async <T = any>(
  chainId: string,
  address: string,
): Promise<T> => {
  return BaseApi.get(
    buildUrl(
      `/history/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}`,
    ),
  );
};

const getHistoryDetail = async <T = any>(
  chainId: string,
  txId: string,
): Promise<T> => {
  return BaseApi.get(
    buildUrl(
      `/history/detail/${encodeURIComponent(chainId)}/${encodeURIComponent(txId)}`,
    ),
  );
};

const getContract = async <T = any>(
  chainId: string,
  contractAddress: string,
): Promise<T> => {
  return BaseApi.get(
    buildUrl(
      `/contract/${encodeURIComponent(chainId)}/${encodeURIComponent(
        contractAddress,
      )}`,
    ),
  );
};

const getGasFee = async <T = any>(chainId: string): Promise<T> => {
  return BaseApi.get(buildUrl(`/gas-oracle/${encodeURIComponent(chainId)}`));
};

const getPrice = async <T = any>(
  chainId: string,
  tokenAddress: string,
): Promise<T> => {
  return BaseApi.get(
    buildUrl(
      `/price/${encodeURIComponent(chainId)}/${encodeURIComponent(tokenAddress)}`,
    ),
  );
};

export const EvmLightNodeLogic = {
  getDiscoveredTokens,
  getDiscoveredNfts,
  getNftDetail,
  getHistory,
  getHistoryDetail,
  getContract,
  getGasFee,
  getPrice,
};
