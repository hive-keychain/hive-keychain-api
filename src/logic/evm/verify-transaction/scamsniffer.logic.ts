import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
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
          path.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "json",
            "phishing-lists",
            "scam-sniffer.json"
          )
        )
        .toString()
    );
  } catch (e) {
    return { domains: [], address: [] };
  }
};

const saveScamSnifferBlacklistFile = (newList: ScamSnifferBlacklist) => {
  try {
    fs.writeFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "json",
        "phishing-lists",
        "scam-sniffer.json"
      ),
      JSON.stringify(newList),
      "utf8"
    );
    Logger.info(`Updated scam-sniffer file`);
  } catch (e) {
    Logger.info("Failed to update scam-sniffer file");
    console.log(e);
  }
};

export const ScamSnifferLogic = {
  initFetchScamSniffer,
  getScamSnifferBlacklistFile,
};
