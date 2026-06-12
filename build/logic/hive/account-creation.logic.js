"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveAccountCreationLogic = void 0;
const dhive_1 = require("@hiveio/dhive");
const crypto_1 = __importDefault(require("crypto"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const ethers_1 = require("ethers");
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const config_1 = require("../../config");
const hive_utils_1 = require("../../utils/hive.utils");
const price_logic_1 = require("../price.logic");
const account_creation_evm_price_logic_1 = require("./account-creation-evm-price.logic");
const account_creation_reconciliation_logic_1 = require("./account-creation-reconciliation.logic");
const account_creation_request_logic_1 = require("./account-creation-request.logic");
const account_creation_request_model_1 = require("./account-creation-request.model");
const account_creation_service_logic_1 = require("./account-creation-service.logic");
let expiryInterval;
let paymentProcessingInterval;
let tokenClaimInterval;
let paymentProcessingInProgress = false;
const safeLogInfo = (message) => {
    try {
        logger_1.default.info(message);
    }
    catch {
        // Unit tests call background logic without initializing the application logger.
    }
};
const safeLogError = (message) => {
    try {
        logger_1.default.error(message);
    }
    catch {
        // Unit tests call background logic without initializing the application logger.
    }
};
const usernameRegex = /^(?=.{3,16}$)[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/;
const ACCOUNT_CREATION_PRICE_HIVE = new decimal_js_1.default(3);
const HIVE_PAYMENT_AMOUNT = ACCOUNT_CREATION_PRICE_HIVE.toFixed(3);
const HIVE_PAYMENT_CURRENCY = "HIVE";
const NATIVE_EVM_TOKEN_DECIMALS = 18;
const MAX_ERC20_TOKEN_DECIMALS = 255;
const validateUsername = (username) => {
    if (!username || !usernameRegex.test(username))
        return false;
    return username
        .split(".")
        .every((segment) => !segment.endsWith("-") && !segment.includes("--"));
};
const validatePublicKey = (key) => {
    if (!key)
        return false;
    try {
        dhive_1.PublicKey.fromString(key);
        return true;
    }
    catch {
        return false;
    }
};
const validateEvmAddress = (address) => typeof address === "string" && (0, ethers_1.isAddress)(address);
const normalizeEvmAddress = (address) => address.trim().toLowerCase();
const validateTxHash = (txHash) => typeof txHash === "string" && /^0x[0-9a-fA-F]{64}$/.test(txHash.trim());
const assertUsernameAvailable = async (username) => {
    const accounts = await hive_utils_1.HiveUtils.getClient().database.getAccounts([username]);
    if (accounts.length > 0) {
        throw Object.assign(new Error("Username is unavailable."), {
            statusCode: 409,
        });
    }
};
const getHiveUsdPrice = () => {
    const hivePrice = price_logic_1.PriceLogic.getHivePrices()?.hive;
    const hiveUsd = hivePrice?.usd;
    if (typeof hiveUsd !== "number" || !Number.isFinite(hiveUsd) || hiveUsd <= 0) {
        throw Object.assign(new Error("HIVE price is unavailable."), {
            statusCode: 503,
        });
    }
    return new decimal_js_1.default(hiveUsd.toString());
};
const getEvmPaymentTokenDecimals = (tokenAddress, tokenDecimals) => {
    if (!tokenAddress)
        return NATIVE_EVM_TOKEN_DECIMALS;
    if (!Number.isInteger(tokenDecimals) ||
        tokenDecimals < 0 ||
        tokenDecimals > MAX_ERC20_TOKEN_DECIMALS) {
        throw Object.assign(new Error("Invalid EVM payment token decimals."), {
            statusCode: 400,
        });
    }
    return tokenDecimals;
};
const formatTokenAmount = (amount, decimals) => {
    return amount
        .toDecimalPlaces(decimals, decimal_js_1.default.ROUND_UP)
        .toFixed(decimals)
        .replace(/(\.\d*?)0+$/, "$1")
        .replace(/\.$/, "");
};
const getHivePaymentQuote = async () => {
    return {
        currency: HIVE_PAYMENT_CURRENCY,
        amount: HIVE_PAYMENT_AMOUNT,
        address: config_1.Config.accountCreation.paymentAccount,
    };
};
const getEvmPaymentQuote = async (chainId, tokenAddress, payerEvmAddress, tokenDecimals) => {
    if (!config_1.Config.accountCreation.evmPaymentAddress) {
        throw Object.assign(new Error("EVM payment address is not configured."), {
            statusCode: 500,
        });
    }
    const paymentTokenDecimals = getEvmPaymentTokenDecimals(tokenAddress, tokenDecimals);
    const price = await account_creation_evm_price_logic_1.AccountCreationEvmPriceLogic.getLatestEvmPrice(chainId, tokenAddress);
    if (!price) {
        throw Object.assign(new Error("Unsupported EVM payment token."), {
            statusCode: 400,
        });
    }
    if (!validateEvmAddress(payerEvmAddress)) {
        throw Object.assign(new Error("Invalid EVM payer address."), {
            statusCode: 400,
        });
    }
    const priceUsd = new decimal_js_1.default(price.priceUsd);
    if (!priceUsd.isFinite() || !priceUsd.gt(0)) {
        throw Object.assign(new Error("Invalid EVM payment token price."), {
            statusCode: 502,
        });
    }
    const amount = ACCOUNT_CREATION_PRICE_HIVE.mul(getHiveUsdPrice()).div(priceUsd);
    return {
        currency: `EVM:${price.chainId}:${price.tokenAddress ?? "native"}`,
        amount: formatTokenAmount(amount, paymentTokenDecimals),
        address: config_1.Config.accountCreation.evmPaymentAddress,
        chainId: price.chainId,
        tokenAddress: price.tokenAddress,
        priceUsd: price.priceUsd,
        payerEvmAddress: normalizeEvmAddress(payerEvmAddress),
    };
};
const getPaymentQuote = async (body) => {
    if (body.paymentChainId !== undefined && body.paymentChainId !== null) {
        return getEvmPaymentQuote(body.paymentChainId.toString(), body.paymentTokenAddress, body.payerEvmAddress, body.paymentTokenDecimals);
    }
    if (body.paymentCurrency?.toUpperCase() === "HIVE") {
        return getHivePaymentQuote();
    }
    throw Object.assign(new Error("Unsupported payment currency."), {
        statusCode: 400,
    });
};
const buildPaymentMemo = (requestId) => `account-creation:${requestId}`;
const buildQuoteResponse = (request) => ({
    requestId: request.requestId,
    status: request.status,
    username: request.username,
    amount: request.expectedAmount,
    currency: request.paymentCurrency,
    chainId: request.paymentChainId,
    tokenAddress: request.paymentTokenAddress,
    priceUsd: request.paymentPriceUsd,
    address: request.paymentAddress,
    memo: request.paymentMemo,
    payerEvmAddress: request.payerEvmAddress,
    expiresAt: request.expiresAt.toISOString(),
});
const buildStatusResponse = (request) => ({
    requestId: request.requestId,
    status: request.status,
    username: request.username,
    payment: {
        amount: request.expectedAmount,
        currency: request.paymentCurrency,
        chainId: request.paymentChainId,
        tokenAddress: request.paymentTokenAddress,
        priceUsd: request.paymentPriceUsd,
        address: request.paymentAddress,
        memo: request.paymentMemo,
        payerEvmAddress: request.payerEvmAddress,
        paidAmount: request.paidAmount,
        txId: request.paymentTxId,
    },
    accountCreation: {
        txId: request.accountCreationTxId,
    },
    expiresAt: request.expiresAt.toISOString(),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
});
const createQuote = async (body) => {
    const username = body.username?.trim().toLowerCase();
    if (!validateUsername(username)) {
        throw Object.assign(new Error("Invalid username format."), {
            statusCode: 400,
        });
    }
    const keys = [
        body.ownerPublicKey,
        body.activePublicKey,
        body.postingPublicKey,
        body.memoPublicKey,
    ];
    if (!keys.every(validatePublicKey)) {
        throw Object.assign(new Error("Invalid public key."), { statusCode: 400 });
    }
    const paymentQuote = await getPaymentQuote(body);
    await assertUsernameAvailable(username);
    const requestId = crypto_1.default.randomUUID();
    const expiresAt = new Date(Date.now() + config_1.Config.accountCreation.quoteTtlMs);
    const request = {
        requestId,
        username: username,
        ownerPublicKey: body.ownerPublicKey,
        activePublicKey: body.activePublicKey,
        postingPublicKey: body.postingPublicKey,
        memoPublicKey: body.memoPublicKey,
        paymentCurrency: paymentQuote.currency,
        paymentChainId: paymentQuote.chainId,
        paymentTokenAddress: paymentQuote.tokenAddress,
        paymentPriceUsd: paymentQuote.priceUsd,
        paymentAddress: paymentQuote.address,
        paymentMemo: paymentQuote.chainId
            ? (paymentQuote.memo ?? null)
            : (paymentQuote.memo ?? buildPaymentMemo(requestId)),
        payerEvmAddress: paymentQuote.payerEvmAddress,
        expectedAmount: paymentQuote.amount,
        paidAmount: null,
        paymentTxId: null,
        accountCreationTxId: null,
        status: account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_PENDING,
        expiresAt,
    };
    return buildQuoteResponse(await account_creation_request_logic_1.HiveAccountCreationRequestLogic.create(request));
};
const assertEvmPaymentRequest = (request) => {
    if (!request.paymentChainId || !request.paymentCurrency.startsWith("EVM:")) {
        throw Object.assign(new Error("Request does not use EVM payment."), {
            statusCode: 400,
        });
    }
};
const assertPaymentTxCanBeSubmitted = (request, body) => {
    assertEvmPaymentRequest(request);
    if (!validateTxHash(body.txHash)) {
        throw Object.assign(new Error("Invalid payment transaction hash."), {
            statusCode: 400,
        });
    }
    if (body.from && !validateEvmAddress(body.from)) {
        throw Object.assign(new Error("Invalid EVM payer address."), {
            statusCode: 400,
        });
    }
    if (body.from &&
        request.payerEvmAddress &&
        normalizeEvmAddress(body.from) !== request.payerEvmAddress) {
        throw Object.assign(new Error("Payment transaction payer does not match."), {
            statusCode: 400,
        });
    }
    if (request.status === account_creation_request_model_1.HiveAccountCreationStatus.EXPIRED ||
        request.status === account_creation_request_model_1.HiveAccountCreationStatus.CANCELLED) {
        throw Object.assign(new Error("Payment quote is no longer active."), {
            statusCode: 409,
        });
    }
};
const submitPaymentTx = async (requestId, body) => {
    const request = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByRequestId(requestId);
    if (!request)
        return null;
    assertPaymentTxCanBeSubmitted(request, body);
    const updatedRequest = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.assignPaymentTxId(request.requestId, body.txHash.trim().toLowerCase(), account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_CONFIRMING);
    return updatedRequest ? buildStatusResponse(updatedRequest) : null;
};
const getStatus = async (requestId) => {
    const request = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByRequestId(requestId);
    return request ? buildStatusResponse(request) : null;
};
const expirePendingQuotes = async (now = new Date()) => {
    return account_creation_request_logic_1.HiveAccountCreationRequestLogic.expirePendingRequests(now);
};
const processPaidAccountCreationRequests = async (detector) => {
    if (paymentProcessingInProgress) {
        safeLogInfo("Hive account creation payment processing skipped: already running");
        return {
            skipped: true,
            reconciliationResults: [],
            accountCreationResults: [],
        };
    }
    paymentProcessingInProgress = true;
    try {
        const reconciliationResults = await account_creation_reconciliation_logic_1.HiveAccountCreationReconciliationLogic.reconcilePendingPayments(detector);
        const accountCreationResults = await account_creation_service_logic_1.HiveAccountCreationServiceLogic.createAccountsForPaidRequests();
        return {
            skipped: false,
            reconciliationResults,
            accountCreationResults,
        };
    }
    catch (error) {
        safeLogError(`Hive account creation payment processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
    }
    finally {
        paymentProcessingInProgress = false;
    }
};
const initExpiryJob = () => {
    if (expiryInterval)
        return;
    expirePendingQuotes();
    expiryInterval = setInterval(() => expirePendingQuotes(), config_1.Config.accountCreation.expiryCheckIntervalMs);
};
const initPaymentProcessingJob = () => {
    if (paymentProcessingInterval)
        return;
    processPaidAccountCreationRequests().catch(() => undefined);
    paymentProcessingInterval = setInterval(() => processPaidAccountCreationRequests().catch(() => undefined), config_1.Config.accountCreation.paymentProcessingIntervalMs);
};
const claimAccountCreationToken = async () => {
    try {
        const result = await account_creation_service_logic_1.HiveAccountCreationServiceLogic.attemptClaimAccountCreationToken();
        if (result === account_creation_service_logic_1.HiveAccountCreationTokenClaimResult.CLAIMED) {
            safeLogInfo(`Hive account creation token claimed for ${config_1.Config.accountCreation.creator.account}`);
        }
        return result;
    }
    catch (error) {
        safeLogError(`Hive account creation token claim failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
    }
};
const initAccountCreationTokenClaimJob = () => {
    if (tokenClaimInterval)
        return;
    claimAccountCreationToken().catch(() => undefined);
    tokenClaimInterval = setInterval(() => claimAccountCreationToken().catch(() => undefined), config_1.Config.accountCreation.tokenClaimIntervalMs);
};
exports.HiveAccountCreationLogic = {
    createQuote,
    getStatus,
    submitPaymentTx,
    expirePendingQuotes,
    processPaidAccountCreationRequests,
    claimAccountCreationToken,
    initExpiryJob,
    initPaymentProcessingJob,
    initAccountCreationTokenClaimJob,
};
//# sourceMappingURL=account-creation.logic.js.map