import Logger from "hive-keychain-commons/lib/logger/logger";
import req from "request";

interface Prices {
  bitcoin: {
    usd: number;
    usd_24h_change: number;
  };
  hive: {
    usd: number;
    usd_24h_change: number;
  };
  hive_dollar: {
    usd: number;
    usd_24h_change: number;
  };
}

let prices: Prices = {
  bitcoin: {
    usd: 24971,
    usd_24h_change: 2.8864365036934996,
  },
  hive: {
    usd: 0.414219,
    usd_24h_change: 3.615225340502734,
  },
  hive_dollar: {
    usd: 1.004,
    usd_24h_change: 2.0253892750535076,
  },
};
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
  setInterval(
    () => {
      refreshPrices();
    },
    process.env.DEV ? 100000 : 20000
  );
};

const getPrices = async () => {
  return prices;
};

const fetchPrices = async (): Promise<Prices> => {
  return new Promise((fulfill) => {
    req(
      {
        url: "https://api.coingecko.com/api/v3/simple/price?ids=hive%2Chive_dollar%2Cbitcoin&vs_currencies=usd&include_24hr_change=true",
        json: true,
      },
      (err, http, body) => {
        if (err || !body.bitcoin || !body.hive || !body.hive_dollar) {
          console.log("error while fetching price", err, {
            bitcoin: body.bitcoin,
            hive: body.hive,
            hive_dollar: body.hive_dollar,
          });
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
