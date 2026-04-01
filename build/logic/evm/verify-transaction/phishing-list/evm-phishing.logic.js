"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmPhishingLogic = void 0;
const keychain_phishing_logic_1 = require("./keychain-phishing.logic");
const metamask_phishing_logic_1 = require("./metamask-phishing.logic");
const PhishingDetector = require("eth-phishing-detect/src/detector");
var PhishingResultType;
(function (PhishingResultType) {
    PhishingResultType["WHITELIST"] = "whitelist";
    PhishingResultType["BLACKLIST"] = "blacklist";
    PhishingResultType["FUZZY"] = "fuzzy";
    PhishingResultType["ALL"] = "all";
})(PhishingResultType || (PhishingResultType = {}));
const verifyDomain = async (domain) => {
    const phishingList = await getPhishingList();
    const detector = new PhishingDetector(phishingList);
    const value = detector.check(domain);
    return {
        isWhitelisted: value.type === PhishingResultType.WHITELIST,
        isBlacklisted: value.type === PhishingResultType.BLACKLIST,
        fuzzy: value.type === PhishingResultType.FUZZY ? value.match : undefined,
    };
};
const getPhishingList = async () => {
    const [keychain, metamask] = await Promise.all([
        keychain_phishing_logic_1.KeychainPhishingLogic.getPhishingList(),
        metamask_phishing_logic_1.MetamaskPhishingLogic.getPhishingList(),
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
exports.EvmPhishingLogic = {
    verifyDomain,
};
//# sourceMappingURL=evm-phishing.logic.js.map