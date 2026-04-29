import { HiveAccountCreationRequestLogic } from "./account-creation-request.logic";
import {
  HiveAccountCreationRequest,
  HiveAccountCreationStatus,
} from "./account-creation-request.model";
import { HiveAccountCreationServiceLogic } from "./account-creation-service.logic";

const buildAdminResponse = (request: HiveAccountCreationRequest) => ({
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

const isEligibleFailedRequest = (request: HiveAccountCreationRequest) => {
  if (request.status !== HiveAccountCreationStatus.ACCOUNT_CREATION_FAILED) {
    return false;
  }
  if (!request.paidAmount || !request.paymentTxId) return false;

  const paidAmount = Number(request.paidAmount);
  const expectedAmount = Number(request.expectedAmount);
  return (
    Number.isFinite(paidAmount) &&
    Number.isFinite(expectedAmount) &&
    paidAmount >= expectedAmount
  );
};

const getByRequestId = async (requestId: string) => {
  const request = await HiveAccountCreationRequestLogic.getByRequestId(requestId);
  return request ? buildAdminResponse(request) : null;
};

const getByUsername = async (username: string) => {
  const normalizedUsername = username.trim().toLowerCase();
  const requests =
    await HiveAccountCreationRequestLogic.getByUsername(normalizedUsername);
  return requests.map(buildAdminResponse);
};

const getByPaymentTxId = async (paymentTxId: string) => {
  const request = await HiveAccountCreationRequestLogic.getByPaymentTxId(
    paymentTxId.trim(),
  );
  return request ? buildAdminResponse(request) : null;
};

const retryFailedAccountCreation = async (requestId: string) => {
  const request = await HiveAccountCreationRequestLogic.getByRequestId(requestId);
  if (!request) return null;
  if (!isEligibleFailedRequest(request)) {
    throw Object.assign(new Error("Request is not an eligible failed request."), {
      statusCode: 409,
    });
  }

  const result =
    await HiveAccountCreationServiceLogic.createAccountFromPaidRequest(request);
  const updatedRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    requestId,
  );

  return {
    result,
    request: updatedRequest ? buildAdminResponse(updatedRequest) : null,
  };
};

const cancelRequest = async (requestId: string) => {
  const request = await HiveAccountCreationRequestLogic.getByRequestId(requestId);
  if (!request) return null;
  if (request.status === HiveAccountCreationStatus.ACCOUNT_CREATED) {
    throw Object.assign(new Error("Created requests cannot be cancelled."), {
      statusCode: 409,
    });
  }

  const updatedRequest = await HiveAccountCreationRequestLogic.updateStatus(
    requestId,
    HiveAccountCreationStatus.CANCELLED,
  );
  return updatedRequest ? buildAdminResponse(updatedRequest) : null;
};

export const HiveAccountCreationAdminLogic = {
  getByRequestId,
  getByUsername,
  getByPaymentTxId,
  retryFailedAccountCreation,
  cancelRequest,
};
