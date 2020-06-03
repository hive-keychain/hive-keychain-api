const req = require("request");

exports.getPhishingAccounts = async () => {
  const phishingAccounts = await getBadActorsList();
  return phishingAccounts
    .split("`")[1]
    .split("\n")
    .filter(e => e !== "");
};

async function getBadActorsList() {
  return new Promise(fulfill => {
    req(
      {
        url:
          "https://gitlab.syncad.com/hive/condenser/-/raw/develop/src/app/utils/BadActorList.js"
      },
      function(err, http, body) {
        fulfill(body);
      }
    );
  });
}
