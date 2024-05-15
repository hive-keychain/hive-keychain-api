import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import Moralis from "moralis";
import { TokensBackgroundColorsLogic } from "../token-background-color";
let isInit = false;
interface EVMTokenInfo {
  address: string;
  address_label: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  total_supply_formatted: number;
  fully_diluted_valuation: number;
  block_number: number;
  validated: number;
  created_at: string;
  possible_spam: false;
  verified_contract: true;
  chain_id: string;
  background_color: string;
  categories: string[];
  links: { [link: string]: string };
}

const getTokensInfo = async (chain: string, addresses: string[]) => {
  const tokensList = await getCurrentTokensList();
  const existingTokensFromList = tokensList.filter(
    (e) => e.chain_id === chain && addresses.includes(e.address)
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
        delete e.logo_hash;
        delete e.thumbnail;
        //@ts-ignore
        delete e.total_supply;
        return {
          ...e,
          chain_id: chain,
          decimals: +e.decimals,
          //@ts-ignore
          total_supply_formatted: +e.total_supply_formatted,
          //@ts-ignore
          fully_diluted_valuation: +e.fully_diluted_valuation,
          block_number: +e.block_number,
          background_color:
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
