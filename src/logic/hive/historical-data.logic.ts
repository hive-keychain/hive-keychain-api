import Logger from "hive-keychain-commons/lib/logger/logger";
import fetch from "node-fetch";

let historicalData;
const refreshHistoricalData = async () => {
  try {
    Logger.info("Fetching historical data");

    const [hive, hbd] = await Promise.all([
      fetchHistoricalData("hive"),
      fetchHistoricalData("hive_dollar"),
    ]);
    if (hive && hbd) {
      historicalData = { hive, hbd };
    }
  } catch (e) {
    Logger.error("failed to refresh historical data", e);
  }
};

const initFetchHistoricalData = () => {
  Logger.technical("Intializing fetch historical prices...");
  void refreshHistoricalData();
  setInterval(
    () => {
      void refreshHistoricalData();
    },
    30 * 60 * 1000,
  );
};

const getHistoricalData = async () => {
  return historicalData;
};

const fetchHistoricalData = async (
  currency: string,
): Promise<number[] | undefined> => {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${currency}/ohlc?vs_currency=usd&days=1&precision=4`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const body = await res.json();
    if (body.status) {
      return undefined;
    }
    return body.map((e: number[]) => e[1]);
  } catch (e) {
    Logger.error(`failed to fetch historical data for ${currency}`, e);
    return undefined;
  }
};

export const HistoricalDataLogic = {
  get: getHistoricalData,
  init: initFetchHistoricalData,
};
