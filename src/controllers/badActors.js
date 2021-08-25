const phishing = require("@hiveio/hivescript/bad-actors.json");
exports.getPhishingAccounts = async () => {
  return phishing;
};
