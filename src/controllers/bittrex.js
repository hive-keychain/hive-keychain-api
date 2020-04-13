const req = require("request");
exports.getValues = async () => {
  const hive = await getHivePrice();
  const btc = await getBTCPrice();
  const hbd = await getHBDPrice();
  return {btc, hive, hbd};
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
        url: "https://bittrex.com/api/v1.1/public/getticker?market=BTC-HIVE",
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
        url: "https://bittrex.com/api/v1.1/public/getticker?market=USDT-BTC",
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
        url: "https://bittrex.com/api/v1.1/public/getticker?market=BTC-HBD",
        json: true
      },
      function(err, http, body) {
        fulfill(body);
      }
    );
  });
}
