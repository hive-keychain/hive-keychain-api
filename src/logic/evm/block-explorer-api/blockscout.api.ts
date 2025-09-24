import Logger from "hive-keychain-commons/lib/logger/logger";
import { BaseApi } from "../../../utils/base";
import { defaultChainList } from "../data/chains.list";

const getAbi = async (chainId: string, address: string) => {
  const chain = defaultChainList.find((c) => c.chainId === chainId);

  if (!chain) {
    Logger.error(`Cannot find chain with chainId ${chainId}`);
    return;
  }

  const res = await get(
    `${chain.blockExplorerApi?.url}/api?module=contract&action=getabi&address=${address}`
  );
  if (res.status === "1") {
    return JSON.parse(res.result);
  }
  return null;
};

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
        `${chain.blockExplorerApi?.url}/api?module=token&action=getToken&contractaddress=${contractAddress}`
      );
      if (res.status === "1") {
        resolve({
          address: contractAddress,
          result: { ...res.result, type: res.result.type.replace("-", "") },
        });
      } else {
        resolve({ address: contractAddress, result: null });
      }
    } catch (err) {
      resolve({ address: contractAddress, result: null });
    }
  });
};

const get = async (url: string): Promise<any> => {
  return await BaseApi.get(url);
};

export const BlockscoutApi = {
  get,
  getAbi,
  getTokenInfo,
};
