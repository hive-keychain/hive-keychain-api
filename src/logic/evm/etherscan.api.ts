import { BaseApi } from "../../utils/base";
import { defaultChainList } from "./data/chains.list";

const getAbi = async (chainId: string, address: string) => {
  const chain = defaultChainList.find((c) => c.chainId === chainId);

  const res = await get(
    `${chain.blockExplorerApi?.url}/api?module=contract&action=getabi&address=${address}`
  );
  if (res.status === "1") {
    return JSON.parse(res.result);
  }
  return null;
};

const getTokenInfo = async (chainId: string, contractAddress: string) => {
  const chain = defaultChainList.find((c) => c.chainId === chainId);

  const res = await get(
    `${chain.blockExplorerApi.url}/api?module=token&action=getToken&contractaddress=${contractAddress}`
  );
  console.log(res);
  if (res.status === "1") {
    return res.result;
  }
  return null;
};

const get = async (url: string): Promise<any> => {
  return await BaseApi.get(url);
};

export const EtherscanApi = {
  get,
  getAbi,
  getTokenInfo,
};
