import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import path from "path";
import {
  HiveAccountCreationRequest,
  HiveAccountCreationRequestStatusUpdate,
  HiveAccountCreationStatus,
  NewHiveAccountCreationRequest,
} from "./account-creation-request.model";

const getRequestStorePath = () =>
  process.env.HIVE_ACCOUNT_CREATION_REQUESTS_FILE ??
  path.join(__dirname, "../../../json/hive-account-creation-requests.json");

const ensureStoreFile = () => {
  const requestStorePath = getRequestStorePath();
  const folder = path.dirname(requestStorePath);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(requestStorePath)) fs.writeFileSync(requestStorePath, "[]");
};

const mapRequest = (row: any): HiveAccountCreationRequest => ({
  requestId: row.requestId,
  username: row.username,
  ownerPublicKey: row.ownerPublicKey,
  activePublicKey: row.activePublicKey,
  postingPublicKey: row.postingPublicKey,
  memoPublicKey: row.memoPublicKey,
  paymentCurrency: row.paymentCurrency,
  paymentAddress: row.paymentAddress,
  paymentMemo: row.paymentMemo,
  expectedAmount: row.expectedAmount,
  paidAmount: row.paidAmount?.toString() ?? null,
  paymentTxId: row.paymentTxId,
  accountCreationTxId: row.accountCreationTxId,
  status: row.status as HiveAccountCreationStatus,
  expiresAt: new Date(row.expiresAt),
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
});

const readRequests = (): HiveAccountCreationRequest[] => {
  try {
    ensureStoreFile();
    return JSON.parse(fs.readFileSync(getRequestStorePath()).toString()).map(
      mapRequest,
    );
  } catch (error) {
    Logger.error(error);
    throw error;
  }
};

const writeRequests = (requests: HiveAccountCreationRequest[]) => {
  try {
    ensureStoreFile();
    fs.writeFileSync(getRequestStorePath(), JSON.stringify(requests, null, 2));
  } catch (error) {
    Logger.error(error);
    throw error;
  }
};

const hasSamePaymentTarget = (
  existing: HiveAccountCreationRequest,
  request: NewHiveAccountCreationRequest,
) =>
  (request.paymentAddress &&
    existing.paymentAddress === request.paymentAddress) ||
  (request.paymentMemo && existing.paymentMemo === request.paymentMemo);

const create = async (
  request: NewHiveAccountCreationRequest,
): Promise<HiveAccountCreationRequest> => {
  const requests = readRequests();
  const existingRequest = requests.find(
    (item) => item.requestId === request.requestId,
  );
  if (existingRequest) return existingRequest;

  if (!request.paymentAddress && !request.paymentMemo) {
    throw new Error("A payment address or memo is required.");
  }

  const existingPaymentTarget = requests.find((item) =>
    hasSamePaymentTarget(item, request),
  );
  if (existingPaymentTarget) {
    throw new Error("Payment address or memo is already assigned.");
  }

  const now = new Date();
  const newRequest: HiveAccountCreationRequest = {
    ...request,
    paymentAddress: request.paymentAddress ?? null,
    paymentMemo: request.paymentMemo ?? null,
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

const getByRequestId = async (
  requestId: string,
): Promise<HiveAccountCreationRequest | null> => {
  return readRequests().find((item) => item.requestId === requestId) ?? null;
};

const updateStatus = async (
  requestId: string,
  status: HiveAccountCreationStatus,
  fields: HiveAccountCreationRequestStatusUpdate = {},
): Promise<HiveAccountCreationRequest | null> => {
  const requests = readRequests();
  const requestIndex = requests.findIndex((item) => item.requestId === requestId);
  if (requestIndex === -1) return null;

  const request = requests[requestIndex];
  const updatedRequest: HiveAccountCreationRequest = {
    ...request,
    status,
    paidAmount:
      fields.paidAmount !== undefined ? fields.paidAmount : request.paidAmount,
    paymentTxId:
      fields.paymentTxId !== undefined
        ? fields.paymentTxId
        : request.paymentTxId,
    accountCreationTxId:
      fields.accountCreationTxId !== undefined
        ? fields.accountCreationTxId
        : request.accountCreationTxId,
    updatedAt: new Date(),
  };

  requests[requestIndex] = updatedRequest;
  writeRequests(requests);

  return updatedRequest;
};

const expirePendingRequests = async (now = new Date()): Promise<number> => {
  const requests = readRequests();
  let expiredCount = 0;

  const updatedRequests = requests.map((request) => {
    const isUnpaidPending =
      request.status === HiveAccountCreationStatus.PAYMENT_PENDING &&
      !request.paidAmount &&
      !request.paymentTxId;
    if (!isUnpaidPending || request.expiresAt.getTime() > now.getTime()) {
      return request;
    }

    expiredCount++;
    return {
      ...request,
      status: HiveAccountCreationStatus.EXPIRED,
      updatedAt: now,
    };
  });

  if (expiredCount > 0) writeRequests(updatedRequests);
  return expiredCount;
};

export const HiveAccountCreationRequestLogic = {
  create,
  getByRequestId,
  updateStatus,
  expirePendingRequests,
};
