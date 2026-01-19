import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
import { defaultChainList } from "./evm/data/chains.list";
import {
  Chain,
  ChainType,
  EvmChain,
} from "./evm/interfaces/evm-chain.interfaces";

const getChains = async (): Promise<Chain[]> => {
  const chainsString = fs.readFileSync(
    path.join(__dirname, "..", "..", "json", "chains.json"),
    "utf8"
  );
  const chains = JSON.parse(chainsString) as Chain[];
  return chains.filter((chain) => chain.active);
};

const getEvmChains = async (): Promise<EvmChain[]> => {
  const chains = await getChains();
  return chains.filter((chain) => chain.type === ChainType.EVM) as EvmChain[];
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
  getEvmChains,
  initChainList,
};
