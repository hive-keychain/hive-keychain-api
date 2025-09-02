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
  if (!list) return;
  console.log("list", list.address.length, list.domains.length);
  await saveScamSnifferBlacklistFile(list);
};
const fetchScamSniffer = (): Promise<ScamSnifferBlacklist | null> => {
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
          __dirname + `/../../../../json/blacklists/scam-sniffer.json`
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
      __dirname + `/../../../../json/blacklists/scam-sniffer.json`,
      JSON.stringify(newList),
      { encoding: "utf8", flag: "wx" },
      (err) => {
        console.log("err", err);
        Logger.info(`Updated scam-sniffer file`);
      }
    );
  } catch (e) {
    console.log("e", e);
    Logger.info("Failed to update scam-sniffer file");
  }
};

export const ScamSnifferLogic = {
  initFetchScamSniffer,
  getScamSnifferBlacklistFile,
};
