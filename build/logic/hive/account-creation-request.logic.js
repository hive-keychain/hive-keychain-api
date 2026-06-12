"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveAccountCreationRequestLogic = void 0;
const fs = __importStar(require("fs"));
const logger_1 = __importDefault(require("hive-keychain-commons/lib/logger/logger"));
const path_1 = __importDefault(require("path"));
const account_creation_request_model_1 = require("./account-creation-request.model");
const getRequestStorePath = () => process.env.HIVE_ACCOUNT_CREATION_REQUESTS_FILE ??
    path_1.default.join(__dirname, "../../../json/hive-account-creation-requests.json");
const ensureStoreFile = () => {
    const requestStorePath = getRequestStorePath();
    const folder = path_1.default.dirname(requestStorePath);
    if (!fs.existsSync(folder))
        fs.mkdirSync(folder, { recursive: true });
    if (!fs.existsSync(requestStorePath))
        fs.writeFileSync(requestStorePath, "[]");
};
const mapRequest = (row) => ({
    requestId: row.requestId,
    username: row.username,
    ownerPublicKey: row.ownerPublicKey,
    activePublicKey: row.activePublicKey,
    postingPublicKey: row.postingPublicKey,
    memoPublicKey: row.memoPublicKey,
    paymentCurrency: row.paymentCurrency,
    paymentChainId: row.paymentChainId ?? null,
    paymentTokenAddress: row.paymentTokenAddress ?? null,
    paymentPriceUsd: row.paymentPriceUsd?.toString() ?? null,
    paymentAddress: row.paymentAddress,
    paymentMemo: row.paymentMemo,
    payerEvmAddress: row.payerEvmAddress ?? null,
    expectedAmount: row.expectedAmount,
    paidAmount: row.paidAmount?.toString() ?? null,
    paymentTxId: row.paymentTxId,
    accountCreationTxId: row.accountCreationTxId,
    status: row.status,
    expiresAt: new Date(row.expiresAt),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
});
const readRequests = () => {
    try {
        ensureStoreFile();
        return JSON.parse(fs.readFileSync(getRequestStorePath()).toString()).map(mapRequest);
    }
    catch (error) {
        logger_1.default.error(error);
        throw error;
    }
};
const writeRequests = (requests) => {
    try {
        ensureStoreFile();
        fs.writeFileSync(getRequestStorePath(), JSON.stringify(requests, null, 2));
    }
    catch (error) {
        logger_1.default.error(error);
        throw error;
    }
};
const getSafePaymentMetadata = (request) => ({
    paymentCurrency: request.paymentCurrency,
    paymentChainId: request.paymentChainId,
    paymentTokenAddress: request.paymentTokenAddress,
    expectedAmount: request.expectedAmount,
    paidAmount: request.paidAmount,
    paymentTxId: request.paymentTxId,
});
const logStatusTransition = (oldRequest, newRequest) => {
    if (oldRequest.status === newRequest.status)
        return;
    try {
        logger_1.default.info(`Hive account creation request status transition ${JSON.stringify({
            requestId: newRequest.requestId,
            oldStatus: oldRequest.status,
            newStatus: newRequest.status,
            payment: getSafePaymentMetadata(newRequest),
            account: newRequest.username,
        })}`);
    }
    catch {
        // Tests exercise this logic without initializing the application logger.
    }
};
const hasSamePaymentTarget = (existing, request) => request.paymentMemo !== null &&
    request.paymentMemo !== undefined &&
    existing.paymentMemo === request.paymentMemo;
const hasSamePaymentTxId = (request, paymentTxId) => request.paymentTxId?.toLowerCase() === paymentTxId.toLowerCase();
const create = async (request) => {
    const requests = readRequests();
    const existingRequest = requests.find((item) => item.requestId === request.requestId);
    if (existingRequest)
        return existingRequest;
    if (!request.paymentAddress && !request.paymentMemo) {
        throw new Error("A payment address or memo is required.");
    }
    const existingPaymentTarget = requests.find((item) => hasSamePaymentTarget(item, request));
    if (existingPaymentTarget) {
        throw new Error("Payment address or memo is already assigned.");
    }
    const now = new Date();
    const newRequest = {
        ...request,
        paymentChainId: request.paymentChainId ?? null,
        paymentTokenAddress: request.paymentTokenAddress ?? null,
        paymentPriceUsd: request.paymentPriceUsd ?? null,
        paymentAddress: request.paymentAddress ?? null,
        paymentMemo: request.paymentMemo ?? null,
        payerEvmAddress: request.payerEvmAddress ?? null,
        paidAmount: request.paidAmount ?? null,
        paymentTxId: request.paymentTxId ?? null,
        accountCreationTxId: request.accountCreationTxId ?? null,
        createdAt: now,
        updatedAt: now,
    };
    requests.push(newRequest);
    writeRequests(requests);
    return newRequest;
};
const getByRequestId = async (requestId) => {
    return readRequests().find((item) => item.requestId === requestId) ?? null;
};
const getByUsername = async (username) => {
    return readRequests().filter((item) => item.username === username);
};
const getByPaymentTxId = async (paymentTxId) => {
    const normalizedPaymentTxId = paymentTxId.toLowerCase();
    return (readRequests().find((item) => item.paymentTxId?.toLowerCase() === normalizedPaymentTxId) ?? null);
};
const assignPaymentTxId = async (requestId, paymentTxId, status) => {
    const requests = readRequests();
    const requestIndex = requests.findIndex((item) => item.requestId === requestId);
    if (requestIndex === -1)
        return null;
    const existingTxRequest = requests.find((item) => item.requestId !== requestId && hasSamePaymentTxId(item, paymentTxId));
    if (existingTxRequest) {
        throw Object.assign(new Error("Payment transaction is already assigned."), {
            statusCode: 409,
        });
    }
    const request = requests[requestIndex];
    if (request.paymentTxId && !hasSamePaymentTxId(request, paymentTxId)) {
        throw Object.assign(new Error("Request already has a payment transaction."), {
            statusCode: 409,
        });
    }
    const updatedRequest = {
        ...request,
        status,
        paymentTxId,
        updatedAt: new Date(),
    };
    requests[requestIndex] = updatedRequest;
    writeRequests(requests);
    logStatusTransition(request, updatedRequest);
    return updatedRequest;
};
const getPaymentReconciliationCandidates = async () => {
    return readRequests().filter((request) => [
        account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_PENDING,
        account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_CONFIRMING,
        account_creation_request_model_1.HiveAccountCreationStatus.EXPIRED,
    ].includes(request.status));
};
const getAccountCreationCandidates = async () => {
    return readRequests().filter((request) => [
        account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_DETECTED,
        account_creation_request_model_1.HiveAccountCreationStatus.OVERPAID,
        account_creation_request_model_1.HiveAccountCreationStatus.CREATING_ACCOUNT,
    ].includes(request.status));
};
const updateStatus = async (requestId, status, fields = {}) => {
    const requests = readRequests();
    const requestIndex = requests.findIndex((item) => item.requestId === requestId);
    if (requestIndex === -1)
        return null;
    const request = requests[requestIndex];
    const updatedRequest = {
        ...request,
        status,
        paidAmount: fields.paidAmount !== undefined ? fields.paidAmount : request.paidAmount,
        paymentTxId: fields.paymentTxId !== undefined
            ? fields.paymentTxId
            : request.paymentTxId,
        accountCreationTxId: fields.accountCreationTxId !== undefined
            ? fields.accountCreationTxId
            : request.accountCreationTxId,
        updatedAt: new Date(),
    };
    requests[requestIndex] = updatedRequest;
    writeRequests(requests);
    logStatusTransition(request, updatedRequest);
    return updatedRequest;
};
const expirePendingRequests = async (now = new Date()) => {
    const requests = readRequests();
    let expiredCount = 0;
    const updatedRequests = requests.map((request) => {
        const isUnpaidPending = request.status === account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_PENDING &&
            !request.paidAmount &&
            !request.paymentTxId;
        if (!isUnpaidPending || request.expiresAt.getTime() > now.getTime()) {
            return request;
        }
        expiredCount++;
        return {
            ...request,
            status: account_creation_request_model_1.HiveAccountCreationStatus.EXPIRED,
            updatedAt: now,
        };
    });
    if (expiredCount > 0)
        writeRequests(updatedRequests);
    updatedRequests.forEach((request, index) => logStatusTransition(requests[index], request));
    return expiredCount;
};
exports.HiveAccountCreationRequestLogic = {
    create,
    getByRequestId,
    getByUsername,
    getByPaymentTxId,
    assignPaymentTxId,
    getPaymentReconciliationCandidates,
    getAccountCreationCandidates,
    updateStatus,
    expirePendingRequests,
};
//# sourceMappingURL=account-creation-request.logic.js.map