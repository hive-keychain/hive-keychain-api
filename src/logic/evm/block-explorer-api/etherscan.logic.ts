import Logger from "hive-keychain-commons/lib/logger/logger";
import { BaseApi } from "../../../utils/base";
import { defaultChainList } from "../data/chains.list";
import { EvmChain } from "../interfaces/evm-chain.interfaces";

const getTokenInfo = async (
  chainId: string,
  contractAddress: string
): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    resolve({
      address: contractAddress,
      result: {
        type: null,
        decimals: null,
        logo: null,
        name: null,
        symbol: null,
      },
    });
    // try {
    //   const chain = defaultChainList.find((c) => c.chainId === chainId);

    //   if (!chain) {
    //     reject(new Error(`Cannot find chain with chainId ${chainId}`));
    //     return;
    //   }

    //   const res = await get(
    //     `${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(
    //       chain.chainId
    //     )}&module=token&action=getToken&contractaddress=${contractAddress}&apikey=${
    //       process.env.ETHERSCAN_API_KEY
    //     }`
    //   );
    //   if (res.status === "1") {
    //     resolve({
    //       address: contractAddress,
    //       result: { ...res.result, type: res.result.type.replace("-", "") },
    //     });
    //   } else {
    //     resolve({ address: contractAddress, result: null });
    //   }
    // } catch (err) {
    //   resolve({ address: contractAddress, result: null });
    // }
  });
};

const getEtherscanInfo = async (query: any) => {
  const chain = defaultChainList.find((c) => c.chainId === query.chain);
  if (!chain) {
    throw new Error(`Cannot find chain with chainId ${query.chain}`);
  }

  switch (query.function) {
    case "discover":
      return await discoverTokens(query.address, chain as EvmChain);
    case "pending-tx-list":
      return await getPendingTransactions(chain as EvmChain, query.address);
    case "get-abi":
      return await getAbi(chain as EvmChain, query.address);
    case "get-token-tx":
      return await getTokenTx(
        query.address,
        chain as EvmChain,
        query.page,
        query.offset
      );
    case "get-history":
      return await getHistory(
        query.address,
        chain as EvmChain,
        query.page,
        query.offset
      );
    case "get-internals-tx":
      return await getInternalsTx(
        query.address,
        chain as EvmChain,
        query.page,
        query.offset
      );
    case "get-nft-tx":
      return await getNftTx(
        query.address,
        chain as EvmChain,
        query.page,
        query.offset
      );
  }
};

const discoverTokens = async (walletAddress: string, chain: EvmChain) => {
  const result = await get(
    `${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(
      chain.chainId
    )}&module=account&action=tokenlist&address=${walletAddress}&apikey=${
      process.env.ETHERSCAN_API_KEY
    }`
  );
  return result
    ? result.map((r: any) => ({ ...r, type: r.type.replace("-", "") }))
    : [];
};

const getNftTx = async (
  walletAddress: string,
  chain: EvmChain,
  page: number,
  offset: number
) => {
  const result = await get(`${
    chain.blockExplorerApi?.url
  }/v2/api?chainid=${Number(
    chain.chainId
  )}&module=account&action=tokennfttx&address=${walletAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${
    process.env.ETHERSCAN_API_KEY
  }
      `);
  return result ?? [];
};

const getInternalsTx = async (
  walletAddress: string,
  chain: EvmChain,
  page: number,
  offset: number
) => {
  const result = await get(`${
    chain.blockExplorerApi?.url
  }/v2/api?chainid=${Number(
    chain.chainId
  )}&module=account&action=txlistinternal&address=${walletAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${
    process.env.ETHERSCAN_API_KEY
  }
      `);
  return result ?? [];
};

const getTokenTx = async (
  walletAddress: string,
  chain: EvmChain,
  page: number,
  offset: number
) => {
  const result = await get(
    `${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(
      chain.chainId
    )}&module=account&action=tokentx&address=${walletAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${
      process.env.ETHERSCAN_API_KEY
    }`
  );
  return result ?? [];
};

const getHistory = async (
  walletAddress: string,
  chain: EvmChain,
  page: number,
  offset: number
) => {
  const result = await get(
    `${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(
      chain.chainId
    )}&module=account&action=txlist&address=${walletAddress}&sort=desc&page=${page}&offset=${offset}&apikey=${
      process.env.ETHERSCAN_API_KEY
    }`
  );
  return result ?? [];
};

const getAbi = async (chain: EvmChain, address: string) => {
  const result = await get(
    `${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(
      chain.chainId
    )}&module=contract&action=getabi&address=${address}&apikey=${
      process.env.ETHERSCAN_API_KEY
    }`
  );
  return result;
};

const get = async (url: string): Promise<any> => {
  try {
    const res = await BaseApi.get(url);
    console.log({ url: url, res: res });
    if (res && res.status === "1") {
      return res.result;
    } else {
      return null;
    }
  } catch (err) {
    Logger.error(err);
    return null;
  }
};

const getPendingTransactions = async (chain: EvmChain, address: string) => {
  const result = await get(
    `${chain.blockExplorerApi?.url}/v2/api?chainid=${Number(
      chain.chainId
    )}&module=account&action=pendingtxlist&address=${address}&page=1&offset=50&apikey=${
      process.env.ETHERSCAN_API_KEY
    }`
  );
  return result;
};

export const EtherscanLogic = {
  get,
  getAbi,
  getTokenInfo,
  getEtherscanInfo,
  getPendingTransactions,
  getHistory,
  getTokenTx,
  getInternalsTx,
  getNftTx,
  discoverTokens,
};
