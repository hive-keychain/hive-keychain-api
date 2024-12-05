import { InfuraProvider } from "@ethersproject/providers";
import detectProxyTarget from "evm-proxy-detection";
import { MetaMaskBlacklistLogic } from "./metamask.logic";
import { ScamSnifferLogic } from "./scamsniffer.logic";

const infuraProvider = new InfuraProvider(1, process.env.INFURA_API_KEY);
const requestFunc = ({ method, params }) => infuraProvider.send(method, params);

export interface DomainResult {
  isBlacklisted: boolean;
  isWhitelisted: boolean;
  // verifiedBy: [{ name: string; icon: string }[]];
}

export interface ContractResult {
  isBlacklisted: boolean;
  proxy: {
    target: string;
  };
}

const verify = async (domain?: string, to?: string, contract?: string) => {
  const [domainResult, toResult, contractResult] = await Promise.all([
    verifyDomain(domain),
    verifyTo(to),
    verifyContract(contract),
  ]);
  return {
    domain: domainResult,
    to: toResult,
    contract: contractResult,
  };
};

const verifyDomain = async (domain?: string) => {
  let result: Partial<DomainResult> = {};
  if (!domain) return;
  const [scamSniffer, metamask] = await Promise.all([
    ScamSnifferLogic.getScamSnifferBlacklistFile(),
    MetaMaskBlacklistLogic.getMetamaskBlacklistFile(),
  ]);
  result.isBlacklisted =
    scamSniffer.domains.includes(domain) || metamask.blacklist.includes(domain);
  result.isWhitelisted = metamask.whitelist.includes(domain);
  return result;
};

const verifyTo = async (to?: string) => {
  if (!to) return;
};

const verifyContract = async (contract?: string) => {
  let result: Partial<ContractResult> = {};
  if (!contract) return;
  const proxy = await detectProxyTarget(
    "0xA7AeFeaD2F25972D80516628417ac46b3F2604Af",
    requestFunc
  );
  result.proxy = proxy;
};

export const VerifyTransactionLogic = {
  verify,
};
