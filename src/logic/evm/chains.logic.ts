import { PopularToken } from "./interfaces/evm-smart-contracts.interface";
import { TokensLogic } from "./tokens.logic";

const getPopularTokens = async (chainId: string): Promise<PopularToken[]> => {
  if (!chainId) return [];

  return TokensLogic.getTokensByChainId(chainId);
};

export const EvmChainsLogic = {
  getPopularTokens,
};
