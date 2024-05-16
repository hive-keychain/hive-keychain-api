import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import Moralis from "moralis";
import { TokensBackgroundColorsLogic } from "../token-background-color";
let isInit = false;
interface EVMTokenInfo {
  address: string;
  addressLabel: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  totalSupplyFormatted: number;
  fullyDilutedValuation: number;
  blockNumber: number;
  validated: number;
  createdAt: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
  chainId: string;
  backgroundColor: string;
  categories: string[];
  links: { [link: string]: string };
}

const getTokensInfo = async (chain: string, addresses: string[]) => {
  const tokensList = await getCurrentTokensList();
  const existingTokensFromList = tokensList.filter(
    (e) => e.chainId === chain && addresses.includes(e.address)
  );
  const newTokens = addresses.filter(
    (e) => !existingTokensFromList.map((t) => t.address).includes(e)
  );
  console.log("list", tokensList);
  console.log("old", existingTokensFromList);
  console.log("new", newTokens);
  const newTokensFromMoralis = await getFromMoralis(chain, newTokens);
  if (newTokens.length)
    saveNewTokensList([...tokensList, ...newTokensFromMoralis]);
  return [...existingTokensFromList, ...newTokensFromMoralis];
};

const getFromMoralis = async (chain: string, addresses: string[]) => {
  try {
    if (!addresses.length) return [];
    Logger.info(`Getting ${addresses.join(",")} from moralis`);
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
          address: e.address,
          name: e.name,
          symbol: e.symbol,
          decimals: +e.decimals,
          logo: e.logo,
          //@ts-ignore
          totalSupplyFormatted: +e.total_supply_formatted,
          //@ts-ignore
          fullyDilutedValuation: +e.fully_diluted_valuation,
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
    ) as EVMTokenInfo[];
  } catch (e) {
    return [];
  }
};

const saveNewTokensList = async (newList: any[]) => {
  try {
    Logger.info("saving new tokens list");
    await fs.writeFile(
      __dirname + `/../../../json/evmTokensInfo.json`,
      JSON.stringify(newList),
      "utf8",
      () => console.log(`Updated evm tokens list`)
    );
  } catch (e) {
    console.log("Failed to update evm tokens list");
  }
};

export const TokensInfoLogic = {
  getTokensInfo,
};
