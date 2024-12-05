import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import req from "request";
export interface ScamSnifferBlacklist {
  address: string[];
  domains: string[];
}

const initFetchScamSniffer = () => {
  fetchAndSaveScamSniffer();
  setInterval(() => {
    fetchAndSaveScamSniffer();
  }, 3600 * 1000);
};

const fetchAndSaveScamSniffer = async () => {
  const list = await fetchScamSniffer();
  console.log("list", list.address.length, list.domains.length);
  await saveScamSnifferBlacklistFile(list);
};
const fetchScamSniffer = (): Promise<ScamSnifferBlacklist> => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://raw.githubusercontent.com/scamsniffer/scam-database/refs/heads/main/blacklist/all.json`,
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

const getScamSnifferBlacklistFile = async (): Promise<ScamSnifferBlacklist> => {
  try {
    return JSON.parse(
      await fs
        .readFileSync(
          __dirname + `/../../../../json/blacklists/scamSniffer.json`
        )
        .toString()
    );
  } catch (e) {
    return { domains: [], address: [] };
  }
};

const saveScamSnifferBlacklistFile = async (newList: ScamSnifferBlacklist) => {
  try {
    await fs.writeFile(
      __dirname + `/../../../../json/blacklists/scamSniffer.json`,
      JSON.stringify(newList),
      "utf8",
      () => Logger.info(`Updated scamSniffer file`)
    );
  } catch (e) {
    Logger.info("Failed to update scamSniffer file");
  }
};

export const ScamSnifferLogic = {
  initFetchScamSniffer,
  getScamSnifferBlacklistFile,
};
