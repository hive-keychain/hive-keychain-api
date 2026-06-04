import { sleep } from "@hiveio/dhive/lib/utils";
import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
import { Config } from "../config";

const PRICES_FILE = path.join(__dirname, `../../json/coingecko-prices.json`);

let prices: Record<string, unknown> | undefined;

const getHivePrices = () => {
  if (!prices?.hive || !prices?.hive_dollar || !prices?.bitcoin) {
    return null;
  }
  return {
    hive: prices.hive,
    hive_dollar: prices.hive_dollar,
    bitcoin: prices.bitcoin,
  };
};

// const getEVMPrices = (coingeckoIds: string[]) => {
//   const result = {}
//   for(const id of coingeckoIds){
//     result[id] = prices[id];
//   }
//   return result;
// }

const loadCachedPrices = () => {
  try {
    prices = JSON.parse(fs.readFileSync(PRICES_FILE, "utf-8"));
  } catch (err) {
    Logger.error("failed to load cached coingecko prices", err);
    prices = undefined;
  }
};

const initFetchPrices = () => {
  Logger.technical("Intializing fetch prices...");
  loadCachedPrices();
  void runRefreshPrices();
};

const fetchPrices = async (ids: string) => {
  console.log("fetching prices", ids);
  const newPrices = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
    .then((res) => {
      return res.json();
    })
    .then((body: any) => {
      if (body.status?.error_code) {
        throw new Error(body.status.error_message);
      }
      for (const key in body) {
        body[key].lastUpdateTimestamp = Date.now();
        body[key].lastUpdated = new Date().toISOString();
      }
      return body;
    })
    .catch((err) => {
      console.log("fetch coingecko error here", err.message);
      return null;
    });
  if (newPrices) return newPrices;
  else {
    await sleep(2000);
    return fetchPrices(ids);
  }
};

const runRefreshPrices = async () => {
  try {
    await refreshPrices();
  } catch (e) {
    Logger.error("failed to refresh prices", e);
    await sleep(Config.coingecko.prices.cooldownBetweenRefresh);
    void runRefreshPrices();
  }
};

const refreshPrices = async () => {
  const start = Date.now();
  console.log("refreshing prices");

  const ids = "hive,hive_dollar,bitcoin";

  const newPrices = await fetchPrices(ids);
  if (newPrices) {
    prices = { ...prices, ...(newPrices as any) };
    fs.writeFileSync(PRICES_FILE, JSON.stringify(prices));
  }

  const end = Date.now();
  console.log(`Fetching prices took ${(end - start) / 1000}s`);

  const waitingTime = Math.max(
    0,
    Config.coingecko.prices.cooldownBetweenRefresh - (end - start),
  );

  console.log(`Waiting for ${waitingTime / 1000}s before starting again`);
  await sleep(waitingTime);

  void runRefreshPrices();
};

export const PriceLogic = {
  getHivePrices,
  fetchPrices,
  initFetchPrices,
};
