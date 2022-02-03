const req = require("request");

let prices;

setInterval(async () => {
  const newPrices = await getPrices();
  if (newPrices) {
    prices = newPrices;
  }
}, 10000);

exports.getValues = async () => {
  return prices;
};

async function getPrices() {
  return new Promise((fulfill) => {
    req(
      {
        url: "https://api.coingecko.com/api/v3/simple/price?ids=hive%2Chive_dollar%2Cbitcoin&vs_currencies=usd&include_24hr_change=true",
        json: true,
      },
      function (err, http, body) {
        if (err || !body.bitcoin || !body.hive || !body.hive_dollar) {
          console.log(err);
        } else fulfill(body);
      }
    );
  });
}
