import { PublicKey } from "@hiveio/dhive";
import crypto from "crypto";
import { Config } from "../../config";
import { HiveUtils } from "../../utils/hive.utils";
import { HiveAccountCreationRequestLogic } from "./account-creation-request.logic";
import {
  HiveAccountCreationRequest,
  HiveAccountCreationStatus,
  NewHiveAccountCreationRequest,
} from "./account-creation-request.model";

interface AccountCreationQuoteRequestBody {
  username?: string;
  ownerPublicKey?: string;
  activePublicKey?: string;
  postingPublicKey?: string;
  memoPublicKey?: string;
  paymentCurrency?: string;
}

interface PaymentCurrencyConfig {
  currency: string;
  amount?: string;
}

const usernameRegex =
  /^(?=.{3,16}$)[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/;

const validateUsername = (username?: string) => {
  if (!username || !usernameRegex.test(username)) return false;
  return username
    .split(".")
    .every((segment) => !segment.endsWith("-") && !segment.includes("--"));
};

const validatePublicKey = (key?: string) => {
  if (!key) return false;
  try {
    PublicKey.fromString(key);
    return true;
  } catch {
    return false;
  }
};

const assertUsernameAvailable = async (username: string) => {
  const accounts = await HiveUtils.getClient().database.getAccounts([username]);
  if (accounts.length > 0) {
    throw Object.assign(new Error("Username is unavailable."), {
      statusCode: 409,
    });
  }
};

const getPaymentCurrencyConfig = (
  currency?: string,
): PaymentCurrencyConfig | undefined => {
  const selectedCurrency = currency?.toUpperCase();
  if (!selectedCurrency) return undefined;
  const currencyConfig = Config.accountCreation.supportedPaymentCurrencies[
    selectedCurrency as keyof typeof Config.accountCreation.supportedPaymentCurrencies
  ];
  if (!currencyConfig) return undefined;
  if (currencyConfig.currency !== "HIVE" && !currencyConfig.amount) {
    return undefined;
  }
  return currencyConfig;
};

const getDynamicHiveAccountCreationFee = async () => {
  const chainProperties = await HiveUtils.getClient().database.getChainProperties();
  const [amount] = chainProperties.account_creation_fee.toString().split(" ");
  return amount;
};

const getExpectedAmount = async (currencyConfig: PaymentCurrencyConfig) => {
  if (currencyConfig.amount) return currencyConfig.amount.split(" ")[0];
  if (currencyConfig.currency === "HIVE") {
    return getDynamicHiveAccountCreationFee();
  }
  throw Object.assign(
    new Error(`No account creation amount configured for ${currencyConfig.currency}.`),
    { statusCode: 400 },
  );
};

const buildPaymentMemo = (requestId: string) => `account-creation:${requestId}`;

const buildQuoteResponse = (request: HiveAccountCreationRequest) => ({
  requestId: request.requestId,
  status: request.status,
  username: request.username,
  amount: request.expectedAmount,
  currency: request.paymentCurrency,
  address: request.paymentAddress,
  memo: request.paymentMemo,
  expiresAt: request.expiresAt.toISOString(),
});

const buildStatusResponse = (request: HiveAccountCreationRequest) => ({
  requestId: request.requestId,
  status: request.status,
  username: request.username,
  payment: {
    amount: request.expectedAmount,
    currency: request.paymentCurrency,
    address: request.paymentAddress,
    memo: request.paymentMemo,
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

const createQuote = async (body: AccountCreationQuoteRequestBody) => {
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

  const currencyConfig = getPaymentCurrencyConfig(body.paymentCurrency);
  if (!currencyConfig) {
    throw Object.assign(new Error("Unsupported payment currency."), {
      statusCode: 400,
    });
  }

  await assertUsernameAvailable(username!);

  const requestId = crypto.randomUUID();
  const expectedAmount = await getExpectedAmount(currencyConfig);
  const expiresAt = new Date(Date.now() + Config.accountCreation.quoteTtlMs);
  const request: NewHiveAccountCreationRequest = {
    requestId,
    username: username!,
    ownerPublicKey: body.ownerPublicKey!,
    activePublicKey: body.activePublicKey!,
    postingPublicKey: body.postingPublicKey!,
    memoPublicKey: body.memoPublicKey!,
    paymentCurrency: currencyConfig.currency,
    paymentAddress: Config.accountCreation.paymentAccount,
    paymentMemo: buildPaymentMemo(requestId),
    expectedAmount,
    paidAmount: null,
    paymentTxId: null,
    accountCreationTxId: null,
    status: HiveAccountCreationStatus.PAYMENT_PENDING,
    expiresAt,
  };

  return buildQuoteResponse(await HiveAccountCreationRequestLogic.create(request));
};

const getStatus = async (requestId: string) => {
  const request = await HiveAccountCreationRequestLogic.getByRequestId(requestId);
  return request ? buildStatusResponse(request) : null;
};

export const HiveAccountCreationLogic = {
  createQuote,
  getStatus,
};
