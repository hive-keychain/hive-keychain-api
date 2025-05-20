import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import Moralis from "moralis";
import { CoingeckoUtils } from "../../utils/coingecko.utils";
import { TokensBackgroundColorsLogic } from "../hive/token-background-color";
import { CoingeckoConfigLogic } from "./coingecko-config";
import { AbiList } from "./data/abi.data";
import { EtherscanApi } from "./etherscan.api";
import {
  EvmSmartContractInfo,
  EvmSmartContractInfoErc1155,
  EvmSmartContractInfoErc721,
  EvmSmartContractInfoNative,
  EVMSmartContractType,
} from "./interfaces/evm-smart-contracts.interface";
let isInit = false;

const getSmartContractInfo = async (chain: string, addresses: string[]) => {
  const smartContractsList = await getCurrentSmartContractList();
  const existingSmartContractsFromList = smartContractsList.filter(
    (smartContract) =>
      smartContract.chainId === chain &&
      smartContract.type !== EVMSmartContractType.NATIVE &&
      addresses.includes(smartContract.address)
  );
  const newSmartContracts = addresses.filter(
    (address) =>
      !existingSmartContractsFromList
        .map((t) => t.type !== EVMSmartContractType.NATIVE && t.address)
        .includes(address)
  );

  console.log({ newSmartContracts });

  const savedNativeToken = smartContractsList.find(
    (token) =>
      token.chainId === chain && token.type === EVMSmartContractType.NATIVE
  );

  const [newSmartContractsFromMoralis, newNativeToken] = await Promise.all([
    getFromMoralis(chain, newSmartContracts),
    !savedNativeToken && getFromCoingecko(chain),
  ]);

  console.log({ newSmartContracts, newSmartContractsFromMoralis });

  let newNativeTokens = newNativeToken ? [newNativeToken] : [];
  if (newSmartContractsFromMoralis.length || newNativeToken) {
    saveNewSmartContractsList([
      ...newNativeTokens,
      ...smartContractsList,
      ...newSmartContractsFromMoralis,
    ]);
  }

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
    smartContracts
  );
};

// const getSmartContractsInfoShort = async (
//   chainId: string,
//   addresses?: string[]
// ) => {
//   const smartContractsInfo = await getSmartContractInfo(chainId, addresses);

//   return smartContractsInfo.map((smartContract: EvmSmartContractInfo) => {
//     const { type, chainId, name, symbol, logo, backgroundColor, coingeckoId } =
//       smartContract;

//     return {
//       type,
//       chainId,
//       name,
//       symbol,
//       logo,
//       backgroundColor,
//       coingeckoId,
//       validated:
//         type !== EVMSmartContractType.NATIVE
//           ? smartContract.validated
//           : undefined,
//       possibleSpam:
//         type !== EVMSmartContractType.NATIVE
//           ? smartContract.possibleSpam
//           : undefined,
//       verifiedContract:
//         type !== EVMSmartContractType.NATIVE
//           ? smartContract.verifiedContract
//           : undefined,
//       address:
//         type !== EVMSmartContractType.NATIVE
//           ? smartContract.address
//           : undefined,
//       decimals:
//         type !== EVMSmartContractType.NATIVE
//           ? smartContract.decimals
//           : undefined,
//     };
//   });
// };

const getFromCoingecko = async (
  chainId: string
): Promise<EvmSmartContractInfoNative> => {
  console.log("getting from coingecko");
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
};

const getFromMoralis = async (
  chain: string,
  addresses: string[]
): Promise<EvmSmartContractInfo[]> => {
  let start = Date.now();
  const tokenAddresses = [];
  const nftAddresses = [];

  const infoPromises = [];

  for (const address of addresses) {
    infoPromises.push(EtherscanApi.getTokenInfo(chain, address));
  }
  const infoResult = await Promise.all(infoPromises);
  console.log("etherscan took", (Date.now() - start) / 1000);
  for (const info of infoResult) {
    console.log({ info, chain });

    if (info) {
      switch (info.type) {
        case "ERC-20":
          tokenAddresses.push(info.address);
          break;
        case "ERC-721":
        case "ERC-1155":
          nftAddresses.push(info.address);
          break;
      }
    }
  }
  let startMoralis = Date.now();
  const [tokensFromMoralis, nftsFromMoralis] = await Promise.all([
    getTokensFromMoralis(chain, tokenAddresses),
    getNftsFromMoralis(chain, nftAddresses),
  ]);
  console.log("moralis took", (Date.now() - startMoralis) / 1000);
  console.log("total moralis function took", (Date.now() - start) / 1000);
  return [...tokensFromMoralis, ...nftsFromMoralis];
};

const getNftsFromMoralis = async (
  chain: string,
  addresses: string[]
): Promise<(EvmSmartContractInfoErc721 | EvmSmartContractInfoErc1155)[]> => {
  try {
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
        console.log("address", address);
        const moralisNftMetadata = (
          await Moralis.EvmApi.nft.getNFTContractMetadata({
            address,
            chain,
          })
        ).toJSON();
        const backgroundColor =
          await TokensBackgroundColorsLogic.getBackgroundColorFromImage(
            moralisNftMetadata.collection_logo
          );
        console.log({ moralisNftMetadata });
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
    return [];
  }
};

const getTokensFromMoralis = async (
  chain: string,
  addresses: string[]
): Promise<EvmSmartContractInfo[]> => {
  try {
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

    console.log({ moralisTokensMetadata });

    return Promise.all(
      moralisTokensMetadata.map(async (moralisTokenMD) => {
        const backgroundColor =
          await TokensBackgroundColorsLogic.getBackgroundColorFromImage(
            moralisTokenMD.logo
          );
        return {
          type: EVMSmartContractType.ERC20,
          address: moralisTokenMD.address,
          name: moralisTokenMD.name,
          symbol: moralisTokenMD.symbol,
          decimals: +moralisTokenMD.decimals,
          logo: moralisTokenMD.logo,
          blockNumber: +moralisTokenMD.block_number,
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

const findSmartContractType = async (chainId: string, address: string) => {
  const tokenInfo = await EtherscanApi.getTokenInfo(chainId, address);

  if (tokenInfo) {
    // switch(tokenInfo)
  }

  const foundAbi = await EtherscanApi.getAbi(chainId, address);

  try {
    const abiFunctions: string[] = foundAbi
      .filter((f) => !!f.name)
      .map((f) => f.name);

    console.log({ abiFunctions });

    for (const abi of AbiList) {
      const allMatch = abi.methods.every((method) => {
        return abiFunctions.includes(method);
      });

      if (allMatch) return abi.type;
    }
  } catch (err) {
    console.log({ err });
    return EVMSmartContractType.ERC20;
  }

  console.log("-------------------");
  return EVMSmartContractType.ERC20;
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
  console.log(newList);
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
  // getSmartContractsInfoShort,
};
