import { InfuraProvider } from "@ethersproject/providers";
import detectProxyTarget from "evm-proxy-detection";
import { EvmPhishingLogic } from "./phishing-list/evm-phishing.logic";
import { ScamSnifferLogic } from "./scamsniffer.logic";

const infuraProvider = new InfuraProvider(1, process.env.INFURA_API_KEY);
const requestFunc = ({ method, params }) => infuraProvider.send(method, params);

export interface DomainResult {
  isBlacklisted: boolean;
  isWhitelisted: boolean;
  fuzzy?: string;
  // verifiedBy: [{ name: string; icon: string }[]];
}

export interface ContractResult {
  isBlacklisted: boolean;
  proxy: {
    target: string;
  } | null;
}

export interface ToResult {
  isBlacklisted: boolean;
}

const verify = async (
  domain?: string,
  to?: string,
  contract?: string,
  chainId?: string
) => {
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
  domain = "metomask.io";
  let result: Partial<DomainResult> = {};
  if (!domain) return;
  const [scamSniffer, verifyDomainResult] = await Promise.all([
    ScamSnifferLogic.getScamSnifferBlacklistFile(),
    EvmPhishingLogic.verifyDomain(domain),
  ]);
  result.isBlacklisted =
    scamSniffer.domains.includes(domain) || verifyDomainResult.isBlacklisted;
  result.isWhitelisted = verifyDomainResult.isWhitelisted;
  result.fuzzy = verifyDomainResult.fuzzy;
  return result;
};

const verifyTo = async (to?: string) => {
  let result: Partial<ToResult> = {};
  if (!to) return;
  const [scamSniffer] = await Promise.all([
    ScamSnifferLogic.getScamSnifferBlacklistFile(),
  ]);
  result.isBlacklisted = scamSniffer.address.includes(to);
  return result;
};

// TODO : remove hardcoded proxy
const verifyContract = async (contract?: string) => {
  let result: Partial<ContractResult> = {};

  if (!contract) return;

  const [scamSniffer] = await Promise.all([
    ScamSnifferLogic.getScamSnifferBlacklistFile(),
  ]);
  const proxy = await detectProxyTarget(contract as `0x${string}`, requestFunc);
  result.proxy = proxy;
  result.isBlacklisted = scamSniffer.address.includes(contract);
  return result;
};

export const VerifyTransactionLogic = {
  verify,
};
