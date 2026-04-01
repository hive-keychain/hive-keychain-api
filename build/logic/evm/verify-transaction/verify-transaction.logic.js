"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyTransactionLogic = void 0;
const providers_1 = require("@ethersproject/providers");
const evm_proxy_detection_1 = __importDefault(require("evm-proxy-detection"));
const evm_phishing_logic_1 = require("./phishing-list/evm-phishing.logic");
const scamsniffer_logic_1 = require("./scamsniffer.logic");
const infuraProvider = new providers_1.InfuraProvider(1, process.env.INFURA_API_KEY);
const requestFunc = ({ method, params }) => infuraProvider.send(method, params);
const verify = async (domain, to, contract, chainId) => {
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
const verifyDomain = async (domain) => {
    let result = {};
    if (!domain)
        return;
    const [scamSniffer, verifyDomainResult] = await Promise.all([
        scamsniffer_logic_1.ScamSnifferLogic.getScamSnifferBlacklistFile(),
        evm_phishing_logic_1.EvmPhishingLogic.verifyDomain(domain),
    ]);
    result.isBlacklisted =
        scamSniffer.domains.includes(domain) || verifyDomainResult.isBlacklisted;
    result.isWhitelisted = verifyDomainResult.isWhitelisted;
    result.fuzzy = verifyDomainResult.fuzzy;
    return result;
};
const verifyTo = async (to) => {
    let result = {};
    if (!to)
        return;
    const [scamSniffer] = await Promise.all([
        scamsniffer_logic_1.ScamSnifferLogic.getScamSnifferBlacklistFile(),
    ]);
    result.isBlacklisted = scamSniffer.address.includes(to);
    return result;
};
const verifyContract = async (contract) => {
    let result = {};
    if (!contract)
        return;
    const [scamSniffer] = await Promise.all([
        scamsniffer_logic_1.ScamSnifferLogic.getScamSnifferBlacklistFile(),
    ]);
    const proxy = await (0, evm_proxy_detection_1.default)(contract, requestFunc);
    result.proxy = proxy;
    result.isBlacklisted = scamSniffer.address.includes(contract);
    return result;
};
exports.VerifyTransactionLogic = {
    verify,
};
//# sourceMappingURL=verify-transaction.logic.js.map