import Logger from "hive-keychain-commons/lib/logger/logger";
import fetch from "node-fetch";

let prices;
const refreshPrices = async () => {
  Logger.info("Fetching prices");

  const newPrices = await fetchPrices();
  if (newPrices) {
    prices = newPrices;
  }
};

const initFetchPrices = () => {
  Logger.technical("Intializing fetch prices...");
  refreshPrices();
  setInterval(() => {
    refreshPrices();
  }, 30000);
};

const getPrices = async () => {
  return prices;
};

const fetchPrices = async () => {
  return new Promise((fulfill) => {
    try {
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hive%2Chive_dollar%2Cbitcoin&vs_currencies=usd&include_24hr_change=true",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((res) => res.json())
        .then((body) => {
          if (!body || !body.bitcoin || !body.hive || !body.hive_dollar) {
            console.log("error");
          } else {
            fulfill(body);
          }
        });
    } catch (err) {
      console.log("fetch coingecko error", err);
    }
  });
};

export const PriceLogic = {
  getPrices,
  fetchPrices,
  initFetchPrices,
};
