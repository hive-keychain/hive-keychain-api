import { BaseApi } from "../../utils/base";
import {
  Chain,
  ChainType,
  EvmChain,
  EvmTransactionType,
  HiveChain,
} from "./interfaces/evm-chain.interfaces";

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
): Promise<T> => {
  return await BaseApi.get(
    buildUrl(
      `/discovery/tokens/${encodeURIComponent(chainId)}/${encodeURIComponent(
        address,
      )}`,
    ),
  );
};

const getDiscoveredNfts = async <T = any>(
  chainId: string,
  address: string,
): Promise<T> => {
  return await BaseApi.get(
    buildUrl(
      `/discovery/nfts/${encodeURIComponent(chainId)}/${encodeURIComponent(
        address,
      )}`,
    ),
  );
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
  cursor?: string,
  limit?: number,
): Promise<T> => {
  const query = new URLSearchParams();
  if (typeof cursor === "string" && cursor.length > 0) {
    query.set("cursor", cursor);
  }
  if (typeof limit === "number") {
    query.set("limit", String(limit));
  }

  return BaseApi.get(
    buildUrl(
      `/history/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}${
        query.toString() ? `?${query.toString()}` : ""
      }`,
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

const getNative = async <T = any>(chainId: string): Promise<T> => {
  return BaseApi.get(buildUrl(`/native/${encodeURIComponent(chainId)}`));
};

const getActiveChains = async (): Promise<Chain[]> => {
  const response = await BaseApi.get(buildUrl("/chains/active"));
  const rawChains = Array.isArray(response) ? response : [];

  const hiveChain = {
    name: "HIVE",
    type: ChainType.HIVE,
    logo: "https://files.peakd.com/file/peakd-hive/cedricguillas/AJmv1BzrF6W3vKz8ah9GJVfnHzA9khi4QAn95cZHNsNpEnSWxoRK61yTPpQcRcX.svg",
    chainId: "beeab0de00000000000000000000000000000000000000000000000000000000",
    mainTokens: {
      hbd: "HBD",
      hive: "HIVE",
      hp: "HP",
    },
    isPopular: true,
    active: true,
  } as HiveChain;

  const filteredChains = rawChains.filter(
    (chain) => String(chain?.chainId) !== hiveChain.chainId,
  );

  return [
    hiveChain,
    ...filteredChains.map((chain) => {
      return {
        name: chain.name,
        chainId: `0x${chain.chainId.toString(16)}`,
        type: ChainType.EVM,
        logo: chain.logoUrl,
        mainToken: chain.nativeSymbol,
        defaultTransactionType: chain.eip1559
          ? EvmTransactionType.EIP_1559
          : EvmTransactionType.LEGACY,
        blockExplorer: chain.blockExplorer,
        blockExplorerApi: chain.blockExplorerApi,
        testnet: chain.testnet,
        isEth: chain.chainId === 1 || chain.chainId === 11155111,
        rpcs: chain.rpcs,
        isPopular: chain.isPopular,
        openSeaChainId: chain.openSeaChainId,
        active: chain.active,
      } as EvmChain;
    }),
  ];
};

export const registerAddress = async (
  chainId: string,
  address: string,
  newAddress?: boolean,
) => {
  return BaseApi.post(
    buildUrl(
      `/register/${encodeURIComponent(Number(chainId))}/${encodeURIComponent(address)}${newAddress ? "/true" : "/false"}`,
    ),
    {},
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
  getNative,
  getActiveChains,
  registerAddress,
};
