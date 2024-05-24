import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import req from "request";
import { EVMTokenInfoShort } from "./evm/tokens-info.logic";

interface CoingeckoConfig {
  platforms: CoingeckoPlatform[];
  tokens: CoingeckoToken[];
}

interface CoingeckoPlatform {
  id: string;
  chain_identifier: number;
  chain_id: string;
  name: string;
  shortname: string;
  native_coin_id: string;
}

interface CoingeckoToken {
  id: string;
  symbol: string;
  name: string;
  platforms: {
    [platformName: string]: string;
  };
}

const initFetchCoingeckoConfig = () => {
  fetchCoingeckoFullConfig();
  setInterval(() => {
    fetchCoingeckoFullConfig();
  }, 3600 * 1000);
};

const fetchCoingeckoFullConfig = async () => {
  const [tokens, platforms] = await Promise.all([
    fetchCoingeckoTokensConfig(),
    fetchCoingeckoPlatformsConfig(),
  ]);
  const fullConfig = await getCoingeckoConfigFile();
  if (tokens) {
    fullConfig.tokens = tokens;
  } else {
    Logger.error("Failed to update coingecko tokens");
  }
  if (platforms) {
    fullConfig.platforms = platforms.map((e) => ({
      ...e,
      chain_id: e.chain_identifier
        ? "0x" + e.chain_identifier.toString(16)
        : undefined,
    }));
  } else {
    Logger.error("Failed to update coingecko platforms");
  }
  saveCoingeckoConfigFile(fullConfig);
};

const fetchCoingeckoTokensConfig = (): Promise<CoingeckoToken[]> => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://api.coingecko.com/api/v3/coins/list?include_platform=true`,
        json: true,
      },
      (err, http, body) => {
        if (err) {
          fulfill(null);
        } else {
          if (body?.status?.error_code) fulfill(null);
          else fulfill(body);
        }
      }
    );
  });
};

const fetchCoingeckoPlatformsConfig = (): Promise<CoingeckoPlatform[]> => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://api.coingecko.com/api/v3/asset_platforms`,
        json: true,
      },
      (err, http, body) => {
        if (err) {
          fulfill(null);
        } else {
          if (body?.status?.error_code) fulfill(null);
          else fulfill(body);
        }
      }
    );
  });
};

const addCoingeckoIdToTokenInfo = async (
  chainId: string,
  tokens: EVMTokenInfoShort[]
) => {
  try {
    const coingeckoConfig = await getCoingeckoConfigFile();
    const chain = coingeckoConfig.platforms.find((e) => e.chain_id === chainId);
    if (!chain) return tokens;
    return tokens.map((token) => {
      const tokenInfo = coingeckoConfig.tokens.find(
        (e) => e.platforms[chain.id] === token.address
      );
      if (tokenInfo) token.coingeckoId = tokenInfo.id;
      return token;
    });
  } catch (e) {
    Logger.error("Error while getting coingeckoId", e);
    return tokens;
  }
};

const getCoingeckoConfigFile = async (): Promise<CoingeckoConfig> => {
  try {
    return JSON.parse(
      await fs
        .readFileSync(__dirname + `/../../json/coingeckoConfig.json`)
        .toString()
    );
  } catch (e) {
    return { platforms: [], tokens: [] };
  }
};

const saveCoingeckoConfigFile = async (newList: CoingeckoConfig) => {
  try {
    await fs.writeFile(
      __dirname + `/../../json/coingeckoConfig.json`,
      JSON.stringify(newList),
      "utf8",
      () => Logger.info(`Updated coingecko config file`)
    );
  } catch (e) {
    Logger.info("Failed to update coingecko config file");
  }
};

const getCoingeckoId = async (chainId: string) => {
  const platform = (await getCoingeckoConfigFile()).platforms.find(
    (p) => p.chain_id === chainId
  );
  return platform ? platform.native_coin_id : "";
};

export const CoingeckoConfigLogic = {
  initFetchCoingeckoConfig,
  addCoingeckoIdToTokenInfo,
  getCoingeckoId,
};
