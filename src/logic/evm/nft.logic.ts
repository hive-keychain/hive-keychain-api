import { BaseApi } from "../../utils/base";
import { EvmChain } from "./interfaces/evm-chain.interfaces";

const getOpenSeaMetadata = async (
  contractAddress: string,
  chain: EvmChain,
  tokenId: string
) => {
  const res = await BaseApi.get(
    `https://api.opensea.io/api/v2/chain/${chain.openSeaChainId!}/contract/${contractAddress}/nfts/${tokenId}`,
    {
      headers: {
        "X-API-KEY": process.env.OPENSEA_API_KEY!,
      },
    }
  );
  return res;
};

export const NftLogic = { getOpenSeaMetadata };
