import Logger from "hive-keychain-commons/lib/logger/logger";
import { BaseApi } from "../../../utils/base";
import { defaultChainList } from "../data/chains.list";
import { EVMSmartContractType } from "../interfaces/evm-smart-contracts.interface";

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
): Promise<{ address: string; result: any | null }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const chain = defaultChainList.find((c) => c.chainId === chainId);

      if (!chain) {
        reject(new Error(`Cannot find chain with chainId ${chainId}`));
        return;
      }

      const res = await get(
        `${chain.blockExplorerApi?.url}/api/v2/addresses/${contractAddress}`
      );
      if (res && res.token) {
        const result = {
          contractAddress: contractAddress,
          chainId: chainId,
          type: res.token.type.replace("-", "") as EVMSmartContractType,
          name: res.token.name,
          symbol: res.token.symbol,
          logo: res.token.icon_url,
          backgroundColor: "#FFFFFF",
          decimals: res.token.decimals ? Number(res.token.decimals) : null,
          possibleSpam: res.is_scam,
          verifiedContract: res.is_verified,
        };

        console.log({
          address: contractAddress,
          result: result,
        });
        resolve({
          address: contractAddress,
          result: result,
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

export const BlockscoutLogic = {
  get,
  getAbi,
  getTokenInfo,
};
