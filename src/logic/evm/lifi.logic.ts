import {
  ChainType,
  config,
  createConfig,
  getChains as LifiGetChains,
  getQuote as LifiGetQuote,
  getTokens as LifiGetTokens,
  QuoteRequestFromAmount,
  SDKBaseConfig,
} from "@lifi/sdk";

let lifiConfig: SDKBaseConfig;

let chains;
let tokens;

const initializeLifi = async () => {
  lifiConfig = await createConfig({
    integrator: "hive-keychain",
    apiKey: process.env.LIFI_API_KEY,
  });
  config.set(lifiConfig);
  setInterval(refreshChainsAndTokens, 1000 * 60 * 60);
  refreshChainsAndTokens();
};

const refreshChainsAndTokens = async () => {
  chains = await LifiGetChains({ chainTypes: [ChainType.EVM] });
  tokens = (
    await LifiGetTokens({ chainTypes: [ChainType.EVM], extended: true })
  ).tokens;
};

const getChains = async () => {
  return chains;
};

const getTokens = async (chainId: string) => {
  return tokens.filter((token) => token.chainId === chainId);
};
const getAllTokens = async () => {
  const result = {};
  for (const chain of Object.keys(tokens)) {
    result[chain] = tokens[chain].filter(
      (token) => token.volumeUSD24H > 200000,
    );
  }
  return result;
};

const getQuote = async (params: QuoteRequestFromAmount) => {
  try {
    const quote = await LifiGetQuote(params);
    console.log("[LIFI] Quote:", quote);
    return { result: quote, status: 200 };
  } catch (error) {
    console.log("[LIFI] Error:", error);
    return { error: "Error getting quote", status: 500 };
  }
};

export const LifiLogic = {
  getQuote,
  initializeLifi,
  getChains,
  getTokens,
  getAllTokens,
};
