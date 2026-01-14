import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
import { defaultChainList } from "./evm/data/chains.list";
import { Chain } from "./evm/interfaces/evm-chain.interfaces";

const getChains = async (): Promise<Chain[]> => {
  const chains = fs.readFileSync(
    path.join(__dirname, "..", "..", "json", "chains.json"),
    "utf8"
  );
  return JSON.parse(chains) as Chain[];
};

const initChainList = async () => {
  try {
    fs.readFileSync(
      path.join(__dirname, "..", "..", "json", "chains.json"),
      "utf8"
    );
  } catch (err) {
    Logger.info("Creating default chain list file");
    fs.writeFileSync(
      path.join(__dirname, "..", "..", "json", "chains.json"),
      JSON.stringify(defaultChainList),
      "utf8"
    );
  }
};

export const ChainLogic = {
  getChains,
  initChainList,
};
