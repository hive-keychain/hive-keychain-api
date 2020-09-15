const req = require("request");

const getPrices = async () => {
  const [hive, btc, hbd] = await Promise.all([
    getHivePrice(),
    getBTCPrice(),
    getHBDPrice()
  ]);
  return { btc, hive, hbd };
};

exports.getValues = async () => {
  const obj = await getPrices();
  const newObj = { btc: {}, hive: {}, hbd: {} };
  for (const key in obj) {
    newObj[key].result = obj[key].result[0];
  }
  return newObj;
};
exports.getValuesV2 = async () => {
  const obj = await getPrices();
  const newObj = {};
  for (const key in obj) {
    const { Bid, PrevDay } = obj[key].result[0];
    const Daily = (((Bid - PrevDay) / PrevDay) * 100).toFixed(2);
    newObj[key] = {
      Bid,
      PrevDay,
      Daily
    };
    if (key !== "btc") {
      const BidBTC = obj.btc.result[0].Bid;
      const PrevDayBTC = obj.btc.result[0].PrevDay;
      const PrevDayUsd = PrevDayBTC * PrevDay;
      const Usd = Bid * BidBTC;
      newObj[key].Usd = Usd.toFixed(2);
      newObj[key].DailyUsd = (((Usd - PrevDayUsd) / PrevDayUsd) * 100).toFixed(
        2
      );
    }
  }
  return newObj;
};

exports.getTicker = async code => {
  return new Promise(fulfill => {
    req(
      {
        url:
          "https://widgets.coinmarketcap.com/v2/ticker/" +
          code +
          "/?ref=widget&convert=USD",
        json: true
      },
      function(err, http, body) {
        fulfill(body);
      }
    );
  });
};

async function getHivePrice() {
  return new Promise(fulfill => {
    req(
      {
        url:
          "https://bittrex.com/api/v1.1/public/getmarketsummary?market=BTC-HIVE",
        json: true
      },
      function(err, http, body) {
        fulfill(body);
      }
    );
  });
}

async function getBTCPrice() {
  return new Promise(fulfill => {
    req(
      {
        url:
          "https://bittrex.com/api/v1.1/public/getmarketsummary?market=USDT-BTC",
        json: true
      },
      function(err, http, body) {
        fulfill(body);
      }
    );
  });
}

async function getHBDPrice() {
  return new Promise(fulfill => {
    req(
      {
        url:
          "https://bittrex.com/api/v1.1/public/getmarketsummary?market=BTC-HBD",
        json: true
      },
      function(err, http, body) {
        fulfill(body);
      }
    );
  });
}
