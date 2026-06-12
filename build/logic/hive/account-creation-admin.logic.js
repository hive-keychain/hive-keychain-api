"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveAccountCreationAdminLogic = void 0;
const account_creation_request_logic_1 = require("./account-creation-request.logic");
const account_creation_request_model_1 = require("./account-creation-request.model");
const account_creation_service_logic_1 = require("./account-creation-service.logic");
const buildAdminResponse = (request) => ({
    requestId: request.requestId,
    username: request.username,
    status: request.status,
    payment: {
        currency: request.paymentCurrency,
        chainId: request.paymentChainId,
        tokenAddress: request.paymentTokenAddress,
        priceUsd: request.paymentPriceUsd,
        address: request.paymentAddress,
        memo: request.paymentMemo,
        payerEvmAddress: request.payerEvmAddress,
        expectedAmount: request.expectedAmount,
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
const isEligibleFailedRequest = (request) => {
    if (request.status !== account_creation_request_model_1.HiveAccountCreationStatus.ACCOUNT_CREATION_FAILED) {
        return false;
    }
    if (!request.paidAmount || !request.paymentTxId)
        return false;
    const paidAmount = Number(request.paidAmount);
    const expectedAmount = Number(request.expectedAmount);
    return (Number.isFinite(paidAmount) &&
        Number.isFinite(expectedAmount) &&
        paidAmount >= expectedAmount);
};
const getByRequestId = async (requestId) => {
    const request = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByRequestId(requestId);
    return request ? buildAdminResponse(request) : null;
};
const getByUsername = async (username) => {
    const normalizedUsername = username.trim().toLowerCase();
    const requests = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByUsername(normalizedUsername);
    return requests.map(buildAdminResponse);
};
const getByPaymentTxId = async (paymentTxId) => {
    const request = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByPaymentTxId(paymentTxId.trim());
    return request ? buildAdminResponse(request) : null;
};
const retryFailedAccountCreation = async (requestId) => {
    const request = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByRequestId(requestId);
    if (!request)
        return null;
    if (!isEligibleFailedRequest(request)) {
        throw Object.assign(new Error("Request is not an eligible failed request."), {
            statusCode: 409,
        });
    }
    const result = await account_creation_service_logic_1.HiveAccountCreationServiceLogic.createAccountFromPaidRequest(request);
    const updatedRequest = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByRequestId(requestId);
    return {
        result,
        request: updatedRequest ? buildAdminResponse(updatedRequest) : null,
    };
};
const cancelRequest = async (requestId) => {
    const request = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByRequestId(requestId);
    if (!request)
        return null;
    if (request.status === account_creation_request_model_1.HiveAccountCreationStatus.ACCOUNT_CREATED) {
        throw Object.assign(new Error("Created requests cannot be cancelled."), {
            statusCode: 409,
        });
    }
    const updatedRequest = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.updateStatus(requestId, account_creation_request_model_1.HiveAccountCreationStatus.CANCELLED);
    return updatedRequest ? buildAdminResponse(updatedRequest) : null;
};
exports.HiveAccountCreationAdminLogic = {
    getByRequestId,
    getByUsername,
    getByPaymentTxId,
    retryFailedAccountCreation,
    cancelRequest,
};
//# sourceMappingURL=account-creation-admin.logic.js.map