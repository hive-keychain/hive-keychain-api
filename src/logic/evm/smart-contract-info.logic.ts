import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import Moralis from "moralis";
import { ArrayUtils } from "../../utils/array.utils";
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
  SmartContractAddress,
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
      .map((smartContract) => ({
        address: smartContract.contractAddress!,
        tokenId: (smartContract as any).tokenId,
      }));
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

const getSmartContractInfo = async (
  chain: string,
  smartContractAddresses: SmartContractAddress[]
) => {
  const savedSmartContractList = await getCurrentSmartContractList();

  const existingSmartContractsFromList: EvmSmartContractInfo[] = [];
  const smartContractsAddressesToFetch: SmartContractAddress[] = [];

  for (const smartContractAddress of smartContractAddresses) {
    const savedSmartContract = savedSmartContractList.find(
      (sc) =>
        sc.chainId === chain &&
        smartContractAddress.address === sc.contractAddress
    );
    if (savedSmartContract) {
      existingSmartContractsFromList.push(savedSmartContract);
    } else {
      smartContractsAddressesToFetch.push(smartContractAddress);
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

  console.log(nativeToken);

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
  smartContractAddresses: SmartContractAddress[]
): Promise<EvmSmartContractInfo[]> => {
  console.log("getting from moralis", smartContractAddresses);
  let start = Date.now();
  const tokenAddresses: SmartContractAddress[] = [];
  const nftAddresses: SmartContractAddress[] = [];
  const otherTokens: EvmSmartContractInfo[] = [];

  const tokens: any[] = [];
  const nfts: any[] = [];

  const infoPromises: Promise<any>[] = [];

  const chain = defaultChainList.find((c) => c.chainId === chainId);
  if (!chainId) return [];

  for (const smartContractAddress of smartContractAddresses) {
    switch (chain?.blockExplorerApi?.type) {
      case BlockExplorerType.BLOCKSCOUT:
        infoPromises.push(
          BlockscoutLogic.getTokenInfo(chainId, smartContractAddress)
        );
        break;
      case BlockExplorerType.AVALANCHE_SCAN:
        console.log("Avalanche scan getting", smartContractAddress);
        infoPromises.push(
          AvalancheLogic.getTokenInfo(chainId, smartContractAddress)
        );
        break;
      case BlockExplorerType.ETHERSCAN:
        infoPromises.push(
          EtherscanLogic.getTokenInfo(chainId, smartContractAddress)
        );
        break;
      default: {
        console.log("No block explorer api type found for chain", chainId);
      }
    }
  }

  const infoResults = await Promise.all(infoPromises);
  console.log(JSON.stringify(infoResults));
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

  // console.log({ tokensFromMoralis, nftsFromMoralis });

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
  contractsAddresses: SmartContractAddress[]
): Promise<
  (EvmSmartContractInfoErc721 | EvmSmartContractInfoErc1155)[] | null
> => {
  try {
    console.log({ getNftsFromMoralis: contractsAddresses });
    if (!contractsAddresses.length) return [];
    Logger.info(
      `Getting nfts ${contractsAddresses
        .map((ca) => ca.address)
        .join(",")} from Moralis for chain ${chain}`
    );
    // await initMoralisIfNeeded();

    await Moralis.EvmApi.nft.getNFTContractMetadata({
      address: contractsAddresses[0].address,
      chain,
    });

    contractsAddresses = contractsAddresses.filter((ca) => ca.tokenId);

    console.log(ArrayUtils.splitArray(contractsAddresses, 25));

    const splitedContractsAddresses = ArrayUtils.splitArray(
      contractsAddresses,
      25
    );

    let result: any[] = [];
    for (const subList of splitedContractsAddresses) {
      result = [
        ...result,
        ...(
          await Moralis.EvmApi.nft.getMultipleNFTs({
            tokens: subList.map((contractAddress) => ({
              tokenAddress: contractAddress.address,
              tokenId: contractAddress.tokenId!,
            })),
            chain,
          })
        ).toJSON(),
      ];
    }

    // const promises = ArrayUtils.splitArray(contractsAddresses, 25).map(
    //   async (subList) => {
    //     return Moralis.EvmApi.nft.getMultipleNFTs({
    //       tokens: subList.map((contractAddress) => ({
    //         tokenAddress: contractAddress.address,
    //         tokenId: contractAddress.tokenId!,
    //       })),
    //       chain,
    //     });
    //   }
    // );

    // const result = await Promise.all(promises);

    // console.log(result);

    // const resultFlag = result.flat();
    // console.log(resultFlag);

    return (await Promise.all(
      result.map(async (moralisNftMetadata) => {
        console.log({ moralisNftMetadata });

        if (!moralisNftMetadata) return null;

        const metadata = moralisNftMetadata?.metadata
          ? JSON.parse(moralisNftMetadata.metadata)
          : null;

        let backgroundColor;
        if (metadata)
          await TokensBackgroundColorsLogic.getBackgroundColorFromImage(
            metadata.image
          );

        return {
          type: moralisNftMetadata?.contract_type as EVMSmartContractType,
          contractAddress: moralisNftMetadata.token_address,
          name: moralisNftMetadata.name,
          symbol: moralisNftMetadata.symbol,
          logo: (moralisNftMetadata as any).collection_logo,
          possibleSpam: moralisNftMetadata.possible_spam,
          verifiedContract: moralisNftMetadata.verified_collection,
          chainId: chain,
          category: (moralisNftMetadata as any).collection_category,
          backgroundColor: backgroundColor,
        };
      })
    )) as (EvmSmartContractInfoErc721 | EvmSmartContractInfoErc1155)[];
  } catch (e) {
    Logger.error("Moralis fetch error", e);
    return null;
  }
};

const getTokensFromMoralis = async (
  chain: string,
  addresses: SmartContractAddress[]
): Promise<EvmSmartContractInfo[] | null> => {
  try {
    if (!addresses.length) return [];
    Logger.info(
      `Getting tokens ${addresses
        .map((a) => a.address)
        .join(",")} from Moralis for chain ${chain}`
    );
    // await initMoralisIfNeeded();

    const moralisTokensMetadata = (
      await Moralis.EvmApi.token.getTokenMetadata({
        addresses: addresses.map((address) => address.address),
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
