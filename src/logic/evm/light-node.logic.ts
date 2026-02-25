import { BaseApi } from "../../utils/base";

const getLightNodeBaseUrl = () => {
  const baseUrl =
    process.env.EVM_LIGHT_NODE_URL || process.env.EVM_LIGHT_NODE_API_URL;

  if (!baseUrl) {
    throw new Error(
      "Missing EVM light node base URL. Set EVM_LIGHT_NODE_URL or EVM_LIGHT_NODE_API_URL.",
    );
  }

  return baseUrl.replace(/\/+$/, "");
};

const buildUrl = (path: string) => `${getLightNodeBaseUrl()}${path}`;

const getDiscoveredTokens = async <T = any>(
  chainId: string,
  address: string,
  isNew?: boolean | string,
): Promise<T> => {
  const newSegment =
    typeof isNew === "undefined" ? "" : `/${encodeURIComponent(String(isNew))}`;
  return BaseApi.get(
    buildUrl(
      `/discovery/tokens/${encodeURIComponent(chainId)}/${encodeURIComponent(
        address,
      )}${newSegment}`,
    ),
  );
};

const getDiscoveredNfts = async <T = any>(
  chainId: string,
  address: string,
): Promise<T> => {
  return BaseApi.get(
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
  return BaseApi.get(buildUrl(`/gas-fee/${encodeURIComponent(chainId)}`));
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
