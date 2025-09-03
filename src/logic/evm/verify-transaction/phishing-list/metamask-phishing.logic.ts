import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
import req from "request";
import { EvmPhishingList } from "../../interfaces/evm-phishing-list.interface";

const initFetchMetamaskBlacklist = () => {
  fetchAndSaveMetamaskBlacklist();
  setInterval(() => {
    fetchAndSaveMetamaskBlacklist();
  }, 3600 * 1000);
};

const fetchAndSaveMetamaskBlacklist = async () => {
  const list = await fetchMetamaskBlacklist();
  if (!list) return;
  console.log("list", list.whitelist.length, list.blacklist.length);
  await saveMetamaskBlacklistFile(list);
};
const fetchMetamaskBlacklist = (): Promise<EvmPhishingList | null> => {
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

const getPhishingList = async (): Promise<EvmPhishingList> => {
  try {
    return JSON.parse(
      await fs
        .readFileSync(
          path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "..",
            "json",
            "phishing-lists",
            "metamask.json"
          )
        )
        .toString()
    );
  } catch (e) {
    return {
      whitelist: [],
      blacklist: [],
      fuzzylist: [],
      version: 0,
      tolerance: 0,
    };
  }
};

const saveMetamaskBlacklistFile = (newList: EvmPhishingList) => {
  try {
    fs.writeFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "..",
        "json",
        "phishing-lists",
        "metamask.json"
      ),
      JSON.stringify(newList),
      "utf8"
    );
    Logger.info(`Updated mm file`);
  } catch (e) {
    Logger.info("Failed to update mm file");
    console.log(e);
  }
};

export const MetamaskPhishingLogic = {
  initFetchMetamaskBlacklist,
  getPhishingList,
};
