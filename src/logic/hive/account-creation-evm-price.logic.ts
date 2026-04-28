import fetch from "node-fetch";
import { Config } from "../../config";

export interface AccountCreationEvmPriceQuote {
  chainId: string;
  tokenAddress: string | null;
  priceUsd: string;
  fetchedAt: string;
}

const getBaseUrl = () =>
  (
    process.env.ACCOUNT_CREATION_EVM_LIGHT_NODE_URL ??
    Config.accountCreation.evmLightNode.baseUrl
  ).replace(/\/$/, "");

const buildPriceUrl = (chainId: string, tokenAddress?: string | null) => {
  const encodedChainId = encodeURIComponent(chainId);
  if (!tokenAddress) return `${getBaseUrl()}/price/${encodedChainId}`;
  return `${getBaseUrl()}/price/${encodedChainId}/${encodeURIComponent(tokenAddress)}`;
};

const getLatestEvmPrice = async (
  chainId: string,
  tokenAddress?: string | null,
): Promise<AccountCreationEvmPriceQuote | null> => {
  const response = await fetch(buildPriceUrl(chainId, tokenAddress));
  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) {
    throw Object.assign(new Error("Unable to validate EVM payment token."), {
      statusCode: 502,
    });
  }

  const price = (await response.json()) as {
    chainId?: string;
    tokenAddress?: string | null;
    priceUsd?: number;
    fetchedAt?: string;
  };
  if (!Number.isFinite(price.priceUsd)) return null;

  return {
    chainId: price.chainId ?? chainId,
    tokenAddress: price.tokenAddress ?? null,
    priceUsd: price.priceUsd!.toString(),
    fetchedAt: price.fetchedAt ?? new Date().toISOString(),
  };
};

export const AccountCreationEvmPriceLogic = {
  getLatestEvmPrice,
};
