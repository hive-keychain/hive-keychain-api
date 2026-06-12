"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveAccountCreationReconciliationLogic = exports.AccountCreationPaymentClassification = void 0;
const account_creation_payment_detector_1 = require("./account-creation-payment-detector");
const account_creation_request_logic_1 = require("./account-creation-request.logic");
const account_creation_request_model_1 = require("./account-creation-request.model");
var AccountCreationPaymentClassification;
(function (AccountCreationPaymentClassification) {
    AccountCreationPaymentClassification["ALREADY_PROCESSING"] = "already_processing";
    AccountCreationPaymentClassification["NO_PAYMENT"] = "no_payment";
    AccountCreationPaymentClassification["FULL_PAYMENT"] = "full_payment";
    AccountCreationPaymentClassification["PAYMENT_CONFIRMING"] = "payment_confirming";
    AccountCreationPaymentClassification["UNDERPAYMENT"] = "underpayment";
    AccountCreationPaymentClassification["OVERPAYMENT"] = "overpayment";
    AccountCreationPaymentClassification["PAYMENT_AFTER_EXPIRY"] = "payment_after_expiry";
    AccountCreationPaymentClassification["WRONG_ASSET"] = "wrong_asset";
})(AccountCreationPaymentClassification || (exports.AccountCreationPaymentClassification = AccountCreationPaymentClassification = {}));
const processingRequestIds = new Set();
const compareAmounts = (actual, expected) => {
    const actualAmount = Number(actual);
    const expectedAmount = Number(expected);
    if (!Number.isFinite(actualAmount) || !Number.isFinite(expectedAmount)) {
        throw new Error("Invalid payment amount.");
    }
    if (actualAmount === expectedAmount)
        return 0;
    return actualAmount > expectedAmount ? 1 : -1;
};
const isAfterExpiry = (request, payment) => payment.detectedAt.getTime() > request.expiresAt.getTime();
const classifyPayment = (request, result) => {
    if (result.type === account_creation_payment_detector_1.AccountCreationPaymentDetectionType.NO_PAYMENT) {
        return {
            classification: AccountCreationPaymentClassification.NO_PAYMENT,
            status: request.status,
        };
    }
    if (result.type === account_creation_payment_detector_1.AccountCreationPaymentDetectionType.WRONG_ASSET) {
        return {
            classification: AccountCreationPaymentClassification.WRONG_ASSET,
            status: request.status,
            payment: result.payment,
        };
    }
    const { payment } = result;
    if (payment.currency !== request.paymentCurrency) {
        return {
            classification: AccountCreationPaymentClassification.WRONG_ASSET,
            status: request.status,
            payment,
        };
    }
    if (isAfterExpiry(request, payment)) {
        return {
            classification: AccountCreationPaymentClassification.PAYMENT_AFTER_EXPIRY,
            status: account_creation_request_model_1.HiveAccountCreationStatus.PAID_AFTER_EXPIRY,
            payment,
        };
    }
    if (!payment.confirmed) {
        return {
            classification: AccountCreationPaymentClassification.PAYMENT_CONFIRMING,
            status: account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_CONFIRMING,
            payment,
        };
    }
    const amountComparison = compareAmounts(payment.amount, request.expectedAmount);
    if (amountComparison < 0) {
        return {
            classification: AccountCreationPaymentClassification.UNDERPAYMENT,
            status: account_creation_request_model_1.HiveAccountCreationStatus.UNDERPAID,
            payment,
        };
    }
    if (amountComparison > 0) {
        return {
            classification: AccountCreationPaymentClassification.OVERPAYMENT,
            status: account_creation_request_model_1.HiveAccountCreationStatus.OVERPAID,
            payment,
        };
    }
    return {
        classification: AccountCreationPaymentClassification.FULL_PAYMENT,
        status: account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_DETECTED,
        payment,
    };
};
const reconcileRequestPayment = async (request, detector = account_creation_payment_detector_1.HiveAccountCreationPaymentDetector) => {
    if (processingRequestIds.has(request.requestId)) {
        return {
            requestId: request.requestId,
            classification: AccountCreationPaymentClassification.ALREADY_PROCESSING,
            status: request.status,
            updated: false,
        };
    }
    processingRequestIds.add(request.requestId);
    try {
        return await reconcileRequestPaymentUnlocked(request, detector);
    }
    finally {
        processingRequestIds.delete(request.requestId);
    }
};
const reconcileRequestPaymentUnlocked = async (request, detector = account_creation_payment_detector_1.HiveAccountCreationPaymentDetector) => {
    const detectionResult = await detector.detectPayment(request);
    const classification = classifyPayment(request, detectionResult);
    const shouldUpdate = classification.payment !== undefined &&
        classification.status !== request.status &&
        classification.classification !== AccountCreationPaymentClassification.WRONG_ASSET;
    if (!shouldUpdate) {
        return {
            requestId: request.requestId,
            classification: classification.classification,
            status: request.status,
            updated: false,
        };
    }
    const updatedRequest = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.updateStatus(request.requestId, classification.status, {
        paidAmount: classification.payment.amount,
        paymentTxId: classification.payment.txId,
    });
    return {
        requestId: request.requestId,
        classification: classification.classification,
        status: updatedRequest?.status ?? request.status,
        updated: updatedRequest !== null,
    };
};
const reconcilePendingPayments = async (detector = account_creation_payment_detector_1.HiveAccountCreationPaymentDetector) => {
    const requests = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getPaymentReconciliationCandidates();
    return Promise.all(requests.map((request) => reconcileRequestPayment(request, detector)));
};
exports.HiveAccountCreationReconciliationLogic = {
    classifyPayment,
    reconcileRequestPayment,
    reconcilePendingPayments,
};
//# sourceMappingURL=account-creation-reconciliation.logic.js.map