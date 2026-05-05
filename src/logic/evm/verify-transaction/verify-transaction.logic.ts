import { EvmPhishingLogic } from "./phishing-list/evm-phishing.logic";
import { ScamSnifferLogic } from "./scamsniffer.logic";

export interface DomainResult {
  isBlacklisted: boolean;
  isWhitelisted: boolean;
  fuzzy?: string;
  // verifiedBy: [{ name: string; icon: string }[]];
}

export interface ContractResult {
  isBlacklisted: boolean;
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

const verifyContract = async (contract?: string) => {
  let result: Partial<ContractResult> = {};

  if (!contract) return;

  const scamSniffer = await ScamSnifferLogic.getScamSnifferBlacklistFile();
  result.isBlacklisted = scamSniffer.address.includes(contract);
  return result;
};

export const VerifyTransactionLogic = {
  verify,
};
