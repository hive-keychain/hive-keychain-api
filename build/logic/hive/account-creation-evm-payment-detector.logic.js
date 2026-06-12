"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountCreationEvmPaymentDetectorLogic = exports.AccountCreationEvmPaymentDetectionType = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const ethers_1 = require("ethers");
const config_1 = require("../../config");
var AccountCreationEvmPaymentDetectionType;
(function (AccountCreationEvmPaymentDetectionType) {
    AccountCreationEvmPaymentDetectionType["NO_PAYMENT"] = "no_payment";
    AccountCreationEvmPaymentDetectionType["PAYMENT_FOUND"] = "payment_found";
    AccountCreationEvmPaymentDetectionType["WRONG_ASSET"] = "wrong_asset";
})(AccountCreationEvmPaymentDetectionType || (exports.AccountCreationEvmPaymentDetectionType = AccountCreationEvmPaymentDetectionType = {}));
const getBaseUrl = () => (process.env.ACCOUNT_CREATION_EVM_LIGHT_NODE_URL ??
    config_1.Config.accountCreation.evmLightNode.baseUrl).replace(/\/$/, "");
const getDecimalChainId = (chainId) => {
    const normalizedChainId = chainId.trim();
    if (/^0x[0-9a-f]+$/i.test(normalizedChainId)) {
        return BigInt(normalizedChainId).toString();
    }
    const numericChainId = Number(normalizedChainId);
    return Number.isFinite(numericChainId)
        ? String(Math.trunc(numericChainId))
        : normalizedChainId;
};
const buildHistoryUrl = (request) => {
    const chainId = getDecimalChainId(request.paymentChainId);
    const address = encodeURIComponent(request.paymentAddress);
    return `${getBaseUrl()}/history/${chainId}/${address}?limit=${config_1.Config.accountCreation.evmPaymentDetection.historyLimit}&showPossibleSpam=true&showUnverified=true`;
};
const isEvmPaymentRequest = (request) => !!request.paymentChainId &&
    !!request.paymentAddress &&
    request.paymentCurrency.startsWith("EVM:");
const areSameAddress = (first, second) => {
    if (!first || !second)
        return false;
    return first.toLowerCase() === second.toLowerCase();
};
const isMatchingTxId = (item, txId) => item.txId?.toLowerCase() === txId.toLowerCase();
const isSuccessfulTransaction = (item) => {
    const status = item.txStatus ?? item.status;
    if (status === undefined || status === null)
        return true;
    if (typeof status === "number")
        return status === 1;
    return status.toUpperCase() !== "REVERTED" && status !== "0";
};
const isFromExpectedPayer = (request, item) => !request.payerEvmAddress ||
    areSameAddress(item.fromAddress, request.payerEvmAddress);
const getNativeAmount = (flow) => {
    if (flow.amount)
        return flow.amount;
    return flow.amountWei ? (0, ethers_1.formatEther)(flow.amountWei) : undefined;
};
const getErc20Amount = (flow, tokenAddress) => {
    if (!areSameAddress(flow.tokenAddress, tokenAddress))
        return undefined;
    return flow.amount;
};
const getMatchingInboundAmount = (request, item) => {
    const inboundFlows = item.in ?? [];
    for (const flow of inboundFlows) {
        if (flow.kind === "NATIVE" && !request.paymentTokenAddress) {
            const amount = getNativeAmount(flow);
            if (amount)
                return amount;
        }
        if (flow.kind === "ERC20" && request.paymentTokenAddress) {
            const amount = getErc20Amount(flow, request.paymentTokenAddress);
            if (amount)
                return amount;
        }
    }
    return undefined;
};
const getLatestBlockNumber = (response) => {
    const blockNumber = response.latestBlockNumber ??
        response.indexedBlockNumber ??
        response.blockNumber ??
        null;
    if (blockNumber === null)
        return undefined;
    const numericBlockNumber = Number(blockNumber);
    return Number.isFinite(numericBlockNumber) ? numericBlockNumber : undefined;
};
const getItemBlockNumber = (item) => {
    const blockNumber = Number(item.blockNumber);
    return Number.isFinite(blockNumber) ? blockNumber : undefined;
};
const isConfirmed = (response, item) => {
    const latestBlockNumber = getLatestBlockNumber(response);
    const blockNumber = getItemBlockNumber(item);
    if (!latestBlockNumber || !blockNumber)
        return true;
    return (latestBlockNumber - blockNumber + 1 >=
        config_1.Config.accountCreation.evmPaymentDetection.requiredConfirmations);
};
const getDetectedAt = (item) => {
    if (!item.blockTime)
        return new Date();
    const detectedAt = new Date(item.blockTime);
    return Number.isNaN(detectedAt.getTime()) ? new Date() : detectedAt;
};
const fetchTreasuryHistory = async (request) => {
    const response = await (0, node_fetch_1.default)(buildHistoryUrl(request));
    if (response.status === 404)
        return null;
    if (!response.ok) {
        throw Object.assign(new Error("Unable to verify EVM payment transaction."), {
            statusCode: 502,
        });
    }
    return (await response.json());
};
const detectPayment = async (request) => {
    if (!isEvmPaymentRequest(request) || !request.paymentTxId) {
        return { type: AccountCreationEvmPaymentDetectionType.NO_PAYMENT };
    }
    const history = await fetchTreasuryHistory(request);
    const item = history?.items?.find((historyItem) => isMatchingTxId(historyItem, request.paymentTxId));
    if (!history || !item) {
        return { type: AccountCreationEvmPaymentDetectionType.NO_PAYMENT };
    }
    if (!isSuccessfulTransaction(item) || !isFromExpectedPayer(request, item)) {
        return {
            type: AccountCreationEvmPaymentDetectionType.WRONG_ASSET,
            payment: {
                amount: "0",
                currency: request.paymentCurrency,
                txId: request.paymentTxId,
                confirmed: false,
                detectedAt: getDetectedAt(item),
                blockNumber: getItemBlockNumber(item),
            },
        };
    }
    const amount = getMatchingInboundAmount(request, item);
    if (!amount) {
        return {
            type: AccountCreationEvmPaymentDetectionType.WRONG_ASSET,
            payment: {
                amount: "0",
                currency: request.paymentCurrency,
                txId: request.paymentTxId,
                confirmed: false,
                detectedAt: getDetectedAt(item),
                blockNumber: getItemBlockNumber(item),
            },
        };
    }
    const detectedPayment = {
        amount,
        currency: request.paymentCurrency,
        txId: request.paymentTxId,
        confirmed: isConfirmed(history, item),
        detectedAt: getDetectedAt(item),
        blockNumber: getItemBlockNumber(item),
    };
    return {
        type: AccountCreationEvmPaymentDetectionType.PAYMENT_FOUND,
        payment: detectedPayment,
    };
};
exports.AccountCreationEvmPaymentDetectorLogic = {
    detectPayment,
};
//# sourceMappingURL=account-creation-evm-payment-detector.logic.js.map