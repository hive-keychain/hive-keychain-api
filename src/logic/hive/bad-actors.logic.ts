const phishing = require("@hiveio/hivescript/bad-actors.json");

const getPhishingAccounts = async () => {
  return phishing;
};

export const BadActorsLogic = {
  getPhishingAccounts,
};
