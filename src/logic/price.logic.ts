import { sleep } from "@hiveio/dhive/lib/utils";
import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
import { Config } from "../config";

let prices;

const getHivePrices = () => {
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

const initFetchPrices = () => {
  Logger.technical("Intializing fetch prices...");
  try {
    prices = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, `../../json/coingecko-prices.json`),
        "utf-8",
      ),
    );
  } catch (err) {
    console.log(err);
  }
  refreshPrices();
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

const refreshPrices = async () => {
  const start = Date.now();
  console.log("refreshing prices");

  let ids = "hive,hive_dollar,bitcoin";

  const newPrices = await fetchPrices(ids);
  if (newPrices) {
    prices = { ...prices, ...(newPrices as any) };
    fs.writeFileSync(
      path.join(__dirname, `../../json/coingecko-prices.json`),
      JSON.stringify(prices),
    );
  }

  const end = Date.now();
  console.log(`Fetching prices took ${(end - start) / 1000}s`);

  const waitingTime = Math.max(
    0,
    Config.coingecko.prices.cooldownBetweenRefresh - (end - start),
  );

  console.log(`Waiting for ${waitingTime / 1000}s before starting again`);
  await sleep(waitingTime);

  refreshPrices();
};

export const PriceLogic = {
  getHivePrices,
  fetchPrices,
  initFetchPrices,
};
