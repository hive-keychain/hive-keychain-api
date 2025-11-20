import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import fetch from "node-fetch";
import path from "path";

let prices;
const refreshPrices = async () => {
  Logger.info("Fetching prices");

  try {
    const newPrices = await fetchPrices();
    if (newPrices) {
      prices = newPrices;
      fs.writeFileSync(
        path.join(__dirname, `../../../json/coingecko-prices.json`),
        JSON.stringify(newPrices)
      );
    }
  } catch (err) {
    console.log("error while fetching prices", err);
  }
};

const initFetchPrices = () => {
  Logger.technical("Intializing fetch prices...");
  try {
    prices = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, `../../../json/coingecko-prices.json`),
        "utf-8"
      )
    );
    console.log(prices);
  } catch (err) {
    console.log(err);
  }
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
        if (!body.bitcoin || !body.hive || !body.hive_dollar) {
          console.log("error in coingecko fetching", body);
        } else {
          fulfill(body);
        }
      });
  });
};

export const PriceLogic = {
  getPrices,
  fetchPrices,
  initFetchPrices,
};
