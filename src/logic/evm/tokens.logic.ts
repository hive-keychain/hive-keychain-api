import { CoingeckoConfigLogic } from "./coingecko-config";

const getTokensByChainId = async (chainId: string) => {
  const chainCoingeckoId = await CoingeckoConfigLogic.getCoingeckoId(chainId);
  const allTokens = await CoingeckoConfigLogic.getCoingeckoConfigFile();
  const bscTokens = allTokens.tokens.filter(
    (token) => !!token.platforms[chainCoingeckoId]
  );
  return bscTokens.map((token) => {
    return {
      name: token.name,
      symbol: token.symbol,
      contractAddress: token.platforms[chainCoingeckoId],
      logo: "https://picsum.photos/200/200",
    };
  });
};

export const TokensLogic = {
  getTokensByChainId,
};
