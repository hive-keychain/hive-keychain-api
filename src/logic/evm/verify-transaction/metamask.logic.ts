import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import req from "request";
export interface MetamaskBlacklist {
  whitelist: string[];
  blacklist: string[];
  fuzzylist: string[];
}

const initFetchMetamaskBlacklist = () => {
  fetchAndSaveMetamaskBlacklist();
  setInterval(() => {
    fetchAndSaveMetamaskBlacklist();
  }, 3600 * 1000);
};

const fetchAndSaveMetamaskBlacklist = async () => {
  const list = await fetchMetamaskBlacklist();
  console.log("list", list.whitelist.length, list.blacklist.length);
  await saveMetamaskBlacklistFile(list);
};
const fetchMetamaskBlacklist = (): Promise<MetamaskBlacklist> => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/refs/heads/main/src/config.json`,
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

const getMetamaskBlacklistFile = async (): Promise<MetamaskBlacklist> => {
  try {
    return JSON.parse(
      await fs
        .readFileSync(__dirname + `/../../../../json/blacklists/metamask.json`)
        .toString()
    );
  } catch (e) {
    return { whitelist: [], blacklist: [], fuzzylist: [] };
  }
};

const saveMetamaskBlacklistFile = async (newList: MetamaskBlacklist) => {
  try {
    await fs.writeFile(
      __dirname + `/../../../../json/blacklists/metamask.json`,
      JSON.stringify(newList),
      "utf8",
      () => Logger.info(`Updated mm file`)
    );
  } catch (e) {
    Logger.info("Failed to update mm file");
  }
};

export const MetaMaskBlacklistLogic = {
  initFetchMetamaskBlacklist,
  getMetamaskBlacklistFile,
};
