import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import Moralis from "moralis";
import { CoingeckoUtils } from "../../utils/coingecko.utils";
import { CoingeckoConfigLogic } from "../coingecko-config";
import { TokensBackgroundColorsLogic } from "../hive/token-background-color";
let isInit = false;

export enum EVMTokenType {
  NATIVE = "NATIVE",
  ERC20 = "ERC20",
}

type EvmTokenInfoBase = {
  name: string;
  symbol: string;
  logo: string;
  chainId: string;
  backgroundColor: string;
  coingeckoId?: string;
};

export type EvmTokenInfoShortNative = EvmTokenInfoBase & {
  type: EVMTokenType.NATIVE;
  coingeckoId: string;
};

export type EvmTokenInfoShortErc20 = EvmTokenInfoBase & {
  type: EVMTokenType.ERC20;
  address: string;
  decimals: number;
  validated: number;
  possibleSpam: boolean;
  verifiedContract: boolean;
};
export type EvmTokenInfoShort =
  | EvmTokenInfoShortErc20
  | EvmTokenInfoShortNative;

export type EvmTokenInfo = EvmTokenInfoShort & {
  blockNumber: number;
  createdAt: string;
  categories: string[];
  links: { [link: string]: any };
};

const getTokensInfo = async (chain: string, addresses: string[]) => {
  const tokensList = await getCurrentTokensList();
  const existingTokensFromList = tokensList.filter(
    (token) =>
      token.chainId === chain &&
      token.type === EVMTokenType.ERC20 &&
      addresses.includes(token.address)
  );
  const newTokens = addresses.filter(
    (address) =>
      !existingTokensFromList
        .map((t) => t.type === EVMTokenType.ERC20 && t.address)
        .includes(address)
  );
  const savedNativeToken = tokensList.find(
    (token) => token.chainId === chain && token.type === EVMTokenType.NATIVE
  );

  const [newTokensFromMoralis, newNativeToken] = await Promise.all([
    getFromMoralis(chain, newTokens),
    !savedNativeToken && getFromCoingecko(chain),
  ]);

  let newNativeTokens = newNativeToken ? [newNativeToken] : [];
  if (newTokensFromMoralis.length || newNativeToken) {
    saveNewTokensList([
      ...newNativeTokens,
      ...tokensList,
      ...newTokensFromMoralis,
    ]);
  }

  const tokens = [...existingTokensFromList, ...newTokensFromMoralis];

  const nativeToken = newNativeToken || savedNativeToken;
  if (nativeToken) {
    tokens.push(nativeToken);
  }

  return await CoingeckoConfigLogic.addCoingeckoIdToTokenInfo(chain, tokens);
};

const getFromCoingecko = async (chainId: string): Promise<EvmTokenInfo> => {
  console.log("getting from coingecko");
  const coingeckoConfig = await CoingeckoConfigLogic.getCoingeckoConfigFile();
  const chain = coingeckoConfig.platforms.find((e) => e.chain_id === chainId);
  const nativeTokenId = chain?.native_coin_id;
  if (nativeTokenId) {
    const nativeToken = await CoingeckoUtils.fetchCoingeckoCoinData(
      nativeTokenId
    );
    return {
      blockNumber: 0,
      type: EVMTokenType.NATIVE,
      createdAt: nativeToken.genesis_date,
      categories: nativeToken.categories,
      links: nativeToken.links,
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
): Promise<EvmTokenInfo[]> => {
  try {
    if (!addresses.length) return [];
    Logger.info(`Getting ${addresses.join(",")} from Moralis`);
    if (!isInit) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      isInit = true;
    }
    const moralisTokenMetadata = (
      await Moralis.EvmApi.token.getTokenMetadata({
        addresses,
        chain,
      })
    ).toJSON();

    return Promise.all(
      moralisTokenMetadata.map(async (e) => {
        return {
          type: EVMTokenType.ERC20,
          address: e.address,
          name: e.name,
          symbol: e.symbol,
          decimals: +e.decimals,
          logo: e.logo,
          blockNumber: +e.block_number,
          validated: e.validated,
          createdAt: e.created_at,
          possibleSpam: e.possible_spam,
          verifiedContract: e.verified_contract,
          chainId: chain,
          //@ts-ignore
          categories: e.categories,
          //@ts-ignore
          links: e.links,
          backgroundColor:
            await TokensBackgroundColorsLogic.getBackgroundColorFromImage(
              e.logo
            ),
        };
      })
    );
  } catch (e) {
    Logger.error("Moralis fetch error", e);
    return [];
  }
};

const getCurrentTokensList = async () => {
  try {
    return JSON.parse(
      await fs
        .readFileSync(__dirname + `/../../../json/evmTokensInfo.json`)
        .toString()
    ) as EvmTokenInfo[];
  } catch (e) {
    return [];
  }
};

const saveNewTokensList = async (newList: any[]) => {
  try {
    await fs.writeFile(
      __dirname + `/../../../json/evmTokensInfo.json`,
      JSON.stringify(newList),
      "utf8",
      () => Logger.info(`Updated evm tokens list`)
    );
  } catch (e) {
    Logger.info("Failed to update evm tokens list");
  }
};

export const TokensInfoLogic = {
  getTokensInfo,
};
