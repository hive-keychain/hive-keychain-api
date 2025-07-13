import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import Moralis from "moralis";
import { CoingeckoUtils } from "../../utils/coingecko.utils";
import { TokensBackgroundColorsLogic } from "../hive/token-background-color";
import { CoingeckoConfigLogic } from "./coingecko-config";
import { EtherscanApi } from "./etherscan.api";
import {
  EvmSmartContractInfo,
  EvmSmartContractInfoErc1155,
  EvmSmartContractInfoErc721,
  EvmSmartContractInfoNative,
  EVMSmartContractType,
} from "./interfaces/evm-smart-contracts.interface";
let isInit = false;

const refreshNullTokens = async () => {
  if (!isInit) {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    isInit = true;
  }

  const savedSmartContractList = await getCurrentSmartContractList();

  const chainIds = [...new Set(savedSmartContractList.map((sc) => sc.chainId))];

  for (const chain of chainIds) {
    const smartContractsToFetch = savedSmartContractList
      .filter(
        (smartContract: EvmSmartContractInfo) =>
          smartContract.address &&
          smartContract.chainId === chain &&
          !smartContract.type
      )
      .map((smartContract) => smartContract.address!);
    const newSmartContractsFromMoralis = await getFromMoralis(
      chain,
      smartContractsToFetch
    );

    // replace in the original list using find index

    for (const newSmartContract of newSmartContractsFromMoralis) {
      const index = savedSmartContractList.findIndex(
        (sc) =>
          sc.address === newSmartContract.address &&
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
      (sc) => sc.chainId === chain && address === sc.address
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

  // console.log({ smartContracts });

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
  chain: string,
  addresses: string[]
): Promise<EvmSmartContractInfo[]> => {
  let start = Date.now();
  const tokenAddresses: string[] = [];
  const nftAddresses: string[] = [];
  const otherTokens: EvmSmartContractInfo[] = [];

  const infoPromises: Promise<any>[] = [];

  for (const address of addresses) {
    infoPromises.push(EtherscanApi.getTokenInfo(chain, address));
  }
  const infoResults = await Promise.all(infoPromises);
  console.log("etherscan took", (Date.now() - start) / 1000);
  for (const infoResult of infoResults) {
    const info = infoResult.result;
    if (info) {
      switch (info.type) {
        case "ERC-20":
          tokenAddresses.push(infoResult.address);
          break;
        case "ERC-721":
        case "ERC-1155":
          nftAddresses.push(infoResult.address);
          break;
      }
    } else {
      otherTokens.push({
        address: infoResult.address,
        chainId: chain,
      } as EvmSmartContractInfo);
    }
  }

  console.log(otherTokens);

  let startMoralis = Date.now();
  const [tokensFromMoralis, nftsFromMoralis] = await Promise.all([
    getTokensFromMoralis(chain, tokenAddresses),
    getNftsFromMoralis(chain, nftAddresses),
  ]);
  console.log("moralis took", (Date.now() - startMoralis) / 1000);
  console.log("total moralis function took", (Date.now() - start) / 1000);
  return [...tokensFromMoralis, ...nftsFromMoralis, ...otherTokens];
};

const getNftsFromMoralis = async (
  chain: string,
  addresses: string[]
): Promise<(EvmSmartContractInfoErc721 | EvmSmartContractInfoErc1155)[]> => {
  try {
    console.log({ getNftsFromMoralis: addresses });
    if (!addresses.length) return [];
    Logger.info(`Getting nfts ${addresses.join(",")} from Moralis`);
    if (!isInit) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      isInit = true;
    }

    return Promise.all(
      addresses.map(async (address) => {
        const moralisNftMetadataResult =
          await Moralis.EvmApi.nft.getNFTContractMetadata({
            address,
            chain,
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
          address: moralisNftMetadata.token_address,
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
    return [] as (EvmSmartContractInfoErc721 | EvmSmartContractInfoErc1155)[];
  }
};

const getTokensFromMoralis = async (
  chain: string,
  addresses: string[]
): Promise<EvmSmartContractInfo[]> => {
  try {
    console.log({ getTokensFromMoralis: addresses });
    if (!addresses.length) return [];
    Logger.info(`Getting tokens ${addresses.join(",")} from Moralis`);
    if (!isInit) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      isInit = true;
    }
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
          address: moralisTokenMD.address,
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
    return [];
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

const saveNewSmartContractsList = async (newList: any[]) => {
  try {
    await fs.writeFile(
      __dirname + `/../../../json/evm-smart-contracts.json`,
      JSON.stringify(newList),
      "utf8",
      () => Logger.info(`Updated evm smart contracts list`)
    );
  } catch (e) {
    Logger.info("Failed to update evm smart contracts list");
  }
};

export const SmartContractsInfoLogic = {
  getSmartContractInfo,
  refreshNullTokens,
};
