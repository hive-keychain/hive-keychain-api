import { Client } from "@hiveio/dhive";

const phishing = require("@hiveio/hivescript/bad-actors.json");

const getPhishingAccounts = async () => {
  return phishing;
};

const getBlacklistedDomains = async () => {
  const client = new Client([
    "https://api.hive.blog",
    "https://api.deathwing.me",
  ]);
  const res = await client.call("bridge", "get_post", {
    author: "keys-defender",
    permlink: "phishing-db",
  });
  return JSON.parse(res.body);
};

export const BadActorsLogic = {
  getPhishingAccounts,
  getBlacklistedDomains,
};
