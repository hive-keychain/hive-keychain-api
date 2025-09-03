import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
import { EvmPhishingList } from "../../interfaces/evm-phishing-list.interface";

const getPhishingList = async () => {
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
            "keychain.json"
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

const setLists = (newList: EvmPhishingList) => {
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
        "keychain.json"
      ),
      JSON.stringify(newList),
      "utf8"
    );
    Logger.info(`Updated keychain file`);
  } catch (e) {
    Logger.info("Failed to update keychain file");
    console.log(e);
  }
};

export const KeychainPhishingLogic = {
  getPhishingList,
  setLists,
};
