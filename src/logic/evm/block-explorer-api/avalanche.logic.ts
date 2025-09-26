import { BaseApi } from "../../../utils/base";
import { defaultChainList } from "../data/chains.list";

const getTokenInfo = async (
  chainId: string,
  contractAddress: string
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const chain = defaultChainList.find((c) => c.chainId === chainId);

      if (!chain) {
        reject(new Error(`Cannot find chain with chainId ${chainId}`));
        return;
      }
      const res = await get(
        `${chain.blockExplorerApi?.url}/v1/chains/${Number(
          chain.chainId
        )}/addresses/${contractAddress}`
      );
      if (!res || res.error) {
        resolve({ address: contractAddress, result: null });
      } else {
        resolve({
          address: contractAddress,
          result: {
            type: res.ercType.replace("-", ""),
            address: contractAddress,
            name: res.name,
            symbol: res.symbol,
            logo: res.logoAsset?.imageUri || null,
            decimals: res.decimals,
            chainId: chain.chainId,
            category: null,
            backgroundColor: res.color,
            links: {
              project_url: null,
              wiki_url: null,
              discord_url: null,
              telegram_url: null,
              twitter_username: null,
              instagram_username: null,
            },
          },
        });
      }
    } catch (err) {
      console.log(err);
      resolve({ address: contractAddress, result: null });
    }
  });
};

const get = async (url: string): Promise<any> => {
  return await BaseApi.get(url);
};

export const AvalancheLogic = { getTokenInfo };
