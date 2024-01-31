import { Client, ClientOptions } from "@hiveio/dhive";

let hiveClient: Client;

const getClient = () => {
  if (!hiveClient)
    hiveClient = new Client(
      ["https://api.hive.blog", "https://api.deathwing.me"],
      {
        consoleOnFailover: true,
        failoverThreshold: 5,
      } as ClientOptions
    );
  return hiveClient;
};

export const HiveUtils = {
  getClient,
};
