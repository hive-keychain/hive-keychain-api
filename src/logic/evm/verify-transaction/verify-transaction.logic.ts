import { ScamSnifferLogic } from "./scamsniffer.logic";

export interface DomainResult {
  isBlacklisted: boolean;
  popularity: "low" | "medium" | "high";
  verifiedBy: [{ name: string; icon: string }[]];
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
  const scamSniffer = await ScamSnifferLogic.getScamSnifferBlacklistFile();
  result.isBlacklisted = scamSniffer.domains.includes(domain);
  return result;
};

const verifyTo = async (to?: string) => {
  if (!to) return;
};

const verifyContract = async (contract?: string) => {
  if (!contract) return;
};

export const VerifyTransactionLogic = {
  verify,
};
