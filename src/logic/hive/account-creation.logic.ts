import { PublicKey } from "@hiveio/dhive";
import crypto from "crypto";
import { Config } from "../../config";
import { HiveUtils } from "../../utils/hive.utils";
import { AccountCreationEvmPriceLogic } from "./account-creation-evm-price.logic";
import { HiveAccountCreationRequestLogic } from "./account-creation-request.logic";
import {
  HiveAccountCreationRequest,
  HiveAccountCreationStatus,
  NewHiveAccountCreationRequest,
} from "./account-creation-request.model";

let expiryInterval: NodeJS.Timeout | undefined;

interface AccountCreationQuoteRequestBody {
  username?: string;
  ownerPublicKey?: string;
  activePublicKey?: string;
  postingPublicKey?: string;
  memoPublicKey?: string;
  paymentCurrency?: string;
  paymentChainId?: string | number;
  paymentTokenAddress?: string | null;
}

interface PaymentQuoteConfig {
  currency: string;
  amount: string;
  address: string;
  memo?: string | null;
  chainId?: string | null;
  tokenAddress?: string | null;
  priceUsd?: string | null;
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

const getDynamicHiveAccountCreationFee = async () => {
  const chainProperties = await HiveUtils.getClient().database.getChainProperties();
  const [amount] = chainProperties.account_creation_fee.toString().split(" ");
  return amount;
};

const formatTokenAmount = (amount: number) => {
  return amount
    .toFixed(18)
    .replace(/\.?0+$/, "");
};

const getHivePaymentQuote = async (): Promise<PaymentQuoteConfig> => {
  return {
    currency: Config.accountCreation.hivePayment.currency,
    amount:
      Config.accountCreation.hivePayment.amount?.split(" ")[0] ??
      (await getDynamicHiveAccountCreationFee()),
    address: Config.accountCreation.paymentAccount,
  };
};

const getEvmPaymentQuote = async (
  chainId: string,
  tokenAddress?: string | null,
): Promise<PaymentQuoteConfig> => {
  if (!Config.accountCreation.evmPaymentAddress) {
    throw Object.assign(new Error("EVM payment address is not configured."), {
      statusCode: 500,
    });
  }

  const price = await AccountCreationEvmPriceLogic.getLatestEvmPrice(
    chainId,
    tokenAddress,
  );
  if (!price) {
    throw Object.assign(new Error("Unsupported EVM payment token."), {
      statusCode: 400,
    });
  }

  const priceUsd = Number(price.priceUsd);
  const amount = Config.accountCreation.evmQuoteAmountUsd / priceUsd;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Object.assign(new Error("Invalid EVM payment token price."), {
      statusCode: 502,
    });
  }

  return {
    currency: `EVM:${price.chainId}:${price.tokenAddress ?? "native"}`,
    amount: formatTokenAmount(amount),
    address: Config.accountCreation.evmPaymentAddress,
    chainId: price.chainId,
    tokenAddress: price.tokenAddress,
    priceUsd: price.priceUsd,
  };
};

const getPaymentQuote = async (
  body: AccountCreationQuoteRequestBody,
): Promise<PaymentQuoteConfig> => {
  if (body.paymentChainId !== undefined && body.paymentChainId !== null) {
    return getEvmPaymentQuote(
      body.paymentChainId.toString(),
      body.paymentTokenAddress,
    );
  }

  if (body.paymentCurrency?.toUpperCase() === "HIVE") {
    return getHivePaymentQuote();
  }

  throw Object.assign(new Error("Unsupported payment currency."), {
    statusCode: 400,
  });
};

const buildPaymentMemo = (requestId: string) => `account-creation:${requestId}`;

const buildQuoteResponse = (request: HiveAccountCreationRequest) => ({
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
  expiresAt: request.expiresAt.toISOString(),
});

const buildStatusResponse = (request: HiveAccountCreationRequest) => ({
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

  const paymentQuote = await getPaymentQuote(body);

  await assertUsernameAvailable(username!);

  const requestId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + Config.accountCreation.quoteTtlMs);
  const request: NewHiveAccountCreationRequest = {
    requestId,
    username: username!,
    ownerPublicKey: body.ownerPublicKey!,
    activePublicKey: body.activePublicKey!,
    postingPublicKey: body.postingPublicKey!,
    memoPublicKey: body.memoPublicKey!,
    paymentCurrency: paymentQuote.currency,
    paymentChainId: paymentQuote.chainId,
    paymentTokenAddress: paymentQuote.tokenAddress,
    paymentPriceUsd: paymentQuote.priceUsd,
    paymentAddress: paymentQuote.address,
    paymentMemo: paymentQuote.memo ?? buildPaymentMemo(requestId),
    expectedAmount: paymentQuote.amount,
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

const expirePendingQuotes = async (now = new Date()) => {
  return HiveAccountCreationRequestLogic.expirePendingRequests(now);
};

const initExpiryJob = () => {
  if (expiryInterval) return;
  expirePendingQuotes();
  expiryInterval = setInterval(
    () => expirePendingQuotes(),
    Config.accountCreation.expiryCheckIntervalMs,
  );
};

export const HiveAccountCreationLogic = {
  createQuote,
  getStatus,
  expirePendingQuotes,
  initExpiryJob,
};
