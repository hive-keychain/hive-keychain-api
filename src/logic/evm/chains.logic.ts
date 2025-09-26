import { PopularToken } from "./interfaces/evm-smart-contracts.interface";

const getPopularTokens = async (chainId: string): Promise<PopularToken[]> => {
  return [
    {
      address: "0x00012411354564656545",
      symbol: "TST",
      name: "Test contract",
      logo: "https://picsum.photos/200/200",
    },
  ];
};

export const EvmChainsLogic = {
  getPopularTokens,
};
