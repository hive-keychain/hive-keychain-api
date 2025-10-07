import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import Moralis from "moralis";
import { CoingeckoUtils } from "../../utils/coingecko.utils";
import { TokensBackgroundColorsLogic } from "../hive/token-background-color";
import { AvalancheLogic } from "./block-explorer-api/avalanche.logic";
import { BlockscoutLogic } from "./block-explorer-api/blockscout.logic";
import { EtherscanLogic } from "./block-explorer-api/etherscan.logic";
import { CoingeckoConfigLogic } from "./coingecko-config";
import { defaultChainList } from "./data/chains.list";
import { BlockExplorerType } from "./interfaces/evm-chain.interfaces";
import {
  EvmSmartContractInfo,
  EvmSmartContractInfoErc1155,
  EvmSmartContractInfoErc721,
  EvmSmartContractInfoNative,
  EVMSmartContractType,
} from "./interfaces/evm-smart-contracts.interface";
let isMoralisInitialized = false;

const initMoralisIfNeeded = async () => {
  if (!isMoralisInitialized) {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    isMoralisInitialized = true;
  }
};

const refreshNullTokens = async () => {
  // await initMoralisIfNeeded();

  const savedSmartContractList = await getCurrentSmartContractList();

  const chainIds = [...new Set(savedSmartContractList.map((sc) => sc.chainId))];

  for (const chain of chainIds) {
    const smartContractsToFetch = savedSmartContractList
      .filter(
        (smartContract: EvmSmartContractInfo) =>
          smartContract.contractAddress &&
          smartContract.chainId === chain &&
          !smartContract.type
      )
      .map((smartContract) => smartContract.contractAddress!);
    const newSmartContractsFromMoralis = await getFromMoralis(
      chain,
      smartContractsToFetch
    );

    // replace in the original list using find index

    for (const newSmartContract of newSmartContractsFromMoralis) {
      const index = savedSmartContractList.findIndex(
        (sc) =>
          sc.contractAddress === newSmartContract.contractAddress &&
          sc.chainId === newSmartContract.chainId
      );
      savedSmartContractList[index] = newSmartContract;
    }
  }
  saveNewSmartContractsList(savedSmartContractList);
};

const getSmartContractInfo = async (chain: string, addresses: string[]) => {
  const savedSmartContractList = await getCurrentSmartContractList();

  const existingSmartContractsFromList: EvmSmartContractInfo[] = [];
  const smartContractsAddressesToFetch: string[] = [];

  for (const address of addresses) {
    const savedSmartContract = savedSmartContractList.find(
      (sc) => sc.chainId === chain && address === sc.contractAddress
    );
    if (savedSmartContract) {
      existingSmartContractsFromList.push(savedSmartContract);
    } else {
      smartContractsAddressesToFetch.push(address);
    }
  }
  console.log({ smartContractsAddressesToFetch });

  const newSmartContractsFromMoralis = await getFromMoralis(
    chain,
    smartContractsAddressesToFetch
  );

  const savedNativeToken = savedSmartContractList.find(
    (token) =>
      token.chainId === chain && token.type === EVMSmartContractType.NATIVE
  );
  const newNativeToken = savedNativeToken
    ? null
    : await getFromCoingecko(chain);

  let newNativeTokens = newNativeToken ? [newNativeToken] : [];

  saveNewSmartContractsList([
    ...newNativeTokens,
    ...savedSmartContractList,
    ...newSmartContractsFromMoralis,
  ]);

  // console.log({
  //   savedTokens: [
  //     ...newNativeTokens,
  //     ...savedSmartContractList,
  //     ...newSmartContractsFromMoralis,
  //   ],
  // });

  const smartContracts = [
    ...existingSmartContractsFromList,
    ...newSmartContractsFromMoralis,
  ];

  const nativeToken = newNativeToken || savedNativeToken;
  if (nativeToken) {
    smartContracts.push(nativeToken);
  }

  return await CoingeckoConfigLogic.addCoingeckoIdToTokenInfo(
    chain,
    smartContracts.filter((info) => !!info.type)
  );
};

const getFromCoingecko = async (
  chainId: string
): Promise<EvmSmartContractInfoNative | null> => {
  console.log("getting from coingecko");
  try {
    const coingeckoConfig = await CoingeckoConfigLogic.getCoingeckoConfigFile();

    const chain = coingeckoConfig.platforms.find((e) => e.chain_id === chainId);

    const nativeTokenId = chain?.native_coin_id;

    if (nativeTokenId) {
      const nativeToken = await CoingeckoUtils.fetchCoingeckoCoinData(
        nativeTokenId
      );
      return {
        type: EVMSmartContractType.NATIVE,
        createdAt: nativeToken.genesis_date,
        categories: nativeToken.categories,
        // links: nativeToken.links,
        name: nativeToken.name,
        logo: nativeToken.image.large,
        backgroundColor:
          await TokensBackgroundColorsLogic.getBackgroundColorFromImage(
            nativeToken.image.large
          ),
        symbol: nativeToken.symbol,
        chainId,
        coingeckoId: nativeTokenId,
      };
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

const getFromMoralis = async (
  chainId: string,
  addresses: string[]
): Promise<EvmSmartContractInfo[]> => {
  let start = Date.now();
  const tokenAddresses: string[] = [];
  const nftAddresses: string[] = [];
  const otherTokens: EvmSmartContractInfo[] = [];

  const tokens: any[] = [];
  const nfts: any[] = [];

  const infoPromises: Promise<any>[] = [];

  const chain = defaultChainList.find((c) => c.chainId === chainId);
  if (!chainId) return [];

  for (const address of addresses) {
    switch (chain?.blockExplorerApi?.type) {
      case BlockExplorerType.BLOCKSCOUT:
        infoPromises.push(BlockscoutLogic.getTokenInfo(chainId, address));
        break;
      case BlockExplorerType.AVALANCHE_SCAN:
        console.log("Avalanche scan getting", address);
        infoPromises.push(AvalancheLogic.getTokenInfo(chainId, address));
        break;
      case BlockExplorerType.ETHERSCAN:
        infoPromises.push(EtherscanLogic.getTokenInfo(chainId, address));
        break;
      default: {
        console.log("No block explorer api type found for chain", chainId);
      }
    }
  }
  const infoResults = await Promise.all(infoPromises);
  console.log("Scan took", (Date.now() - start) / 1000);
  for (const infoResult of infoResults) {
    const info = infoResult.result;
    if (info) {
      switch (info.type) {
        case "ERC20":
          tokenAddresses.push(infoResult.address);
          tokens.push(infoResult.result);
          break;
        case "ERC721":
        case "ERC1155":
          nftAddresses.push(infoResult.address);
          nfts.push(infoResult.result);
          break;
        case null: {
          tokenAddresses.push(infoResult.address);
          nftAddresses.push(infoResult.address);
        }
      }
    } else {
      otherTokens.push({
        contractAddress: infoResult.address,
        chainId: chainId,
      } as EvmSmartContractInfo);
    }
  }

  let startMoralis = Date.now();
  const [tokensFromMoralis, nftsFromMoralis] = await Promise.all([
    getTokensFromMoralis(chainId, tokenAddresses),
    getNftsFromMoralis(chainId, nftAddresses),
  ]);

  console.log("moralis took", (Date.now() - startMoralis) / 1000);
  console.log("total moralis function took", (Date.now() - start) / 1000);

  return [
    ...(tokensFromMoralis && tokensFromMoralis.length > 0
      ? tokensFromMoralis
      : tokens),
    ...(nftsFromMoralis && nftsFromMoralis.length > 0 ? nftsFromMoralis : nfts),
    ...otherTokens,
  ];
};

const getNftsFromMoralis = async (
  chain: string,
  addresses: string[]
): Promise<
  (EvmSmartContractInfoErc721 | EvmSmartContractInfoErc1155)[] | null
> => {
  try {
    console.log({ getNftsFromMoralis: addresses });
    if (!addresses.length) return [];
    Logger.info(
      `Getting nfts ${addresses.join(",")} from Moralis for chain ${chain}`
    );
    // await initMoralisIfNeeded();

    await Moralis.EvmApi.nft.getNFTContractMetadata({
      address: addresses[0],
      chain,
    });

    return Promise.all(
      addresses.map(async (address) => {
        const moralisNftMetadataResult = await Moralis.EvmApi.nft
          .getNFTContractMetadata({
            address,
            chain,
          })
          .catch((e) => {
            throw e;
          });

        const moralisNftMetadata = moralisNftMetadataResult
          ? moralisNftMetadataResult.toJSON()
          : ({} as any);
        const backgroundColor =
          await TokensBackgroundColorsLogic.getBackgroundColorFromImage(
            moralisNftMetadata.collection_logo!
          );
        return {
          type: moralisNftMetadata.contract_type as EVMSmartContractType,
          contractAddress: moralisNftMetadata.token_address,
          name: moralisNftMetadata.name,
          symbol: moralisNftMetadata.symbol,
          logo: moralisNftMetadata.collection_logo,
          possibleSpam: moralisNftMetadata.possible_spam,
          verifiedContract: moralisNftMetadata.verified_collection,
          chainId: chain,
          category: moralisNftMetadata.collection_category,
          backgroundColor: backgroundColor,
          links: {
            project_url: moralisNftMetadata.project_url,
            wiki_url: moralisNftMetadata.wiki_url,
            discord_url: moralisNftMetadata.discord_url,
            telegram_url: moralisNftMetadata.telegram_url,
            twitter_username: moralisNftMetadata.twitter_username,
            instagram_username: moralisNftMetadata.instagram_username,
          },
        };
      })
    );
  } catch (e) {
    Logger.error("Moralis fetch error", e);
    return null;
  }
};

const getTokensFromMoralis = async (
  chain: string,
  addresses: string[]
): Promise<EvmSmartContractInfo[] | null> => {
  try {
    if (!addresses.length) return [];
    Logger.info(
      `Getting tokens ${addresses.join(",")} from Moralis for chain ${chain}`
    );
    // await initMoralisIfNeeded();

    const moralisTokensMetadata = (
      await Moralis.EvmApi.token.getTokenMetadata({
        addresses,
        chain,
      })
    ).toJSON();

    //@ts-ignore
    return Promise.all(
      moralisTokensMetadata.map(async (moralisTokenMD) => {
        const backgroundColor =
          await TokensBackgroundColorsLogic.getBackgroundColorFromImage(
            moralisTokenMD.logo!
          );
        return {
          type: EVMSmartContractType.ERC20,
          contractAddress: moralisTokenMD.address,
          name: moralisTokenMD.name,
          symbol: moralisTokenMD.symbol,
          decimals: +moralisTokenMD.decimals,
          logo: moralisTokenMD.logo,
          blockNumber: +(moralisTokenMD.block_number ?? -1),
          validated: moralisTokenMD.validated,
          createdAt: moralisTokenMD.created_at,
          possibleSpam: moralisTokenMD.possible_spam,
          verifiedContract: moralisTokenMD.verified_contract,
          chainId: chain,
          // categories: moralisTokenMD.categories,
          // links: moralisTokenMD.links,
          backgroundColor: backgroundColor,
        };
      })
    );
  } catch (e) {
    Logger.error("Moralis fetch error", e);
    return null;
  }
};

const getCurrentSmartContractList = async () => {
  try {
    return JSON.parse(
      await fs
        .readFileSync(__dirname + `/../../../json/evm-smart-contracts.json`)
        .toString()
    ) as EvmSmartContractInfo[];
  } catch (e) {
    return [];
  }
};

const saveNewSmartContractsList = (newList: any[]) => {
  try {
    fs.writeFileSync(
      __dirname + `/../../../json/evm-smart-contracts.json`,
      JSON.stringify(newList),
      "utf8"
    );
    Logger.info(`Updated evm smart contracts list`);
  } catch (e) {
    Logger.info("Failed to update evm smart contracts list");
    console.log(e);
  }
};

export const SmartContractsInfoLogic = {
  getSmartContractInfo,
  refreshNullTokens,
  getCurrentSmartContractList,
  saveNewSmartContractsList,
  initMoralisIfNeeded,
};
