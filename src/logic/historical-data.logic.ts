import Logger from "hive-keychain-commons/lib/logger/logger";
import req from "request";

let historicalData;
const refreshHistoricalData = async () => {
  Logger.info("Fetching historical data");

  const [hive, hbd] = await Promise.all([
    fetchHistoricalData("hive"),
    fetchHistoricalData("hive_dollar"),
  ]);
  if (hive && hbd) {
    historicalData = { hive, hbd };
  }
};

const initFetchHistoricalData = () => {
  Logger.technical("Intializing fetch prices...");
  refreshHistoricalData();
  setInterval(() => {
    refreshHistoricalData();
  }, 30 * 60 * 1000);
};

const getHistoricalData = async () => {
  return historicalData;
};

const fetchHistoricalData = async (currency: string) => {
  // return;
  return new Promise((fulfill) => {
    req(
      {
        url: `https://api.coingecko.com/api/v3/coins/${currency}/ohlc?vs_currency=usd&days=1&precision=4`,
        json: true,
      },
      (err, http, body) => {
        if (body.status) {
          //do nothing
        } else fulfill(body.map((e) => e[1]));
      }
    );
  });
};

export const HistoricalDataLogic = {
  get: getHistoricalData,
  init: initFetchHistoricalData,
};
