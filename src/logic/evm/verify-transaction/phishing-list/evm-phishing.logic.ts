import { EvmPhishingList } from "../../interfaces/evm-phishing-list.interface";
import { DomainResult } from "../verify-transaction.logic";
import { KeychainPhishingLogic } from "./keychain-phishing.logic";
import { MetamaskPhishingLogic } from "./metamask-phishing.logic";
const PhishingDetector = require("eth-phishing-detect/src/detector");

enum PhishingResultType {
  WHITELIST = "whitelist",
  BLACKLIST = "blacklist",
  FUZZY = "fuzzy",
  ALL = "all",
}

const verifyDomain = async (domain: string): Promise<DomainResult> => {
  const phishingList = await getPhishingList();

  const detector = new PhishingDetector(phishingList);
  const value = detector.check(domain);
  return {
    isWhitelisted: value.type === PhishingResultType.WHITELIST,
    isBlacklisted: value.type === PhishingResultType.BLACKLIST,
    fuzzy: value.type === PhishingResultType.FUZZY ? value.match : undefined,
  };
};

const getPhishingList = async (): Promise<EvmPhishingList> => {
  const [keychain, metamask] = await Promise.all([
    KeychainPhishingLogic.getPhishingList(),
    MetamaskPhishingLogic.getPhishingList(),
  ]);

  const phishingList = {
    whitelist: [...keychain.whitelist, ...metamask.whitelist],
    blacklist: [...keychain.blacklist, ...metamask.blacklist],
    fuzzylist: [...keychain.fuzzylist, ...metamask.fuzzylist],
    version: metamask.version,
    tolerance: metamask.tolerance,
  };

  return phishingList;
};

export const EvmPhishingLogic = {
  verifyDomain,
};
