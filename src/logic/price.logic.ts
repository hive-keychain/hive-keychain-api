import Logger from "hive-keychain-commons/lib/logger/logger";
import req from "request";

let prices;
const refreshPrices = async () => {
  Logger.info("Fetching prices");

  const newPrices = await fetchPrices();
  if (newPrices) {
    prices = newPrices;
  }
};

const initFetchPrices = () => {
  Logger.technical("Initializing fetch prices...");
  refreshPrices();
  setInterval(() => {
    refreshPrices();
  }, 20000);
};

const getPrices = async () => {
  return prices;
};

const fetchPrices = async () => {
  return new Promise((fulfill) => {
    req(
      {
        url: "https://api.coingecko.com/api/v3/simple/price?ids=hive%2Chive_dollar%2Cbitcoin&vs_currencies=usd&include_24hr_change=true",
        json: true,
      },
      (err, http, body) => {
        if (err || !body.bitcoin || !body.hive || !body.hive_dollar) {
          console.log(err);
        } else {
          fulfill(body);
        }
      }
    );
  });
};

export const PriceLogic = {
  getPrices,
  fetchPrices,
  initFetchPrices,
};
