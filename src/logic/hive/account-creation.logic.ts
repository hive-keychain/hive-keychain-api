import { PublicKey } from "@hiveio/dhive";
import crypto from "crypto";
import Decimal from "decimal.js";
import { isAddress } from "ethers";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { Config } from "../../config";
import { HiveUtils } from "../../utils/hive.utils";
import { PriceLogic } from "../price.logic";
import { AccountCreationEvmPriceLogic } from "./account-creation-evm-price.logic";
import { AccountCreationPaymentDetector } from "./account-creation-payment-detector";
import { HiveAccountCreationReconciliationLogic } from "./account-creation-reconciliation.logic";
import { HiveAccountCreationRequestLogic } from "./account-creation-request.logic";
import {
  HiveAccountCreationRequest,
  HiveAccountCreationStatus,
  NewHiveAccountCreationRequest,
} from "./account-creation-request.model";
import {
  HiveAccountCreationServiceLogic,
  HiveAccountCreationTokenClaimResult,
} from "./account-creation-service.logic";

let expiryInterval: NodeJS.Timeout | undefined;
let paymentProcessingInterval: NodeJS.Timeout | undefined;
let tokenClaimInterval: NodeJS.Timeout | undefined;
let paymentProcessingInProgress = false;

const safeLogInfo = (message: string) => {
  try {
    Logger.info(message);
  } catch {
    // Unit tests call background logic without initializing the application logger.
  }
};

const safeLogError = (message: string) => {
  try {
    Logger.error(message);
  } catch {
    // Unit tests call background logic without initializing the application logger.
  }
};

interface AccountCreationQuoteRequestBody {
  username?: string;
  ownerPublicKey?: string;
  activePublicKey?: string;
  postingPublicKey?: string;
  memoPublicKey?: string;
  paymentCurrency?: string;
  paymentChainId?: string | number;
  paymentTokenAddress?: string | null;
  paymentTokenDecimals?: number;
  payerEvmAddress?: string;
}

interface AccountCreationPaymentTxRequestBody {
  txHash?: string;
  from?: string;
}

interface PaymentQuoteConfig {
  currency: string;
  amount: string;
  address: string;
  memo?: string | null;
  chainId?: string | null;
  tokenAddress?: string | null;
  priceUsd?: string | null;
  payerEvmAddress?: string | null;
}

const usernameRegex =
  /^(?=.{3,16}$)[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/;
const ACCOUNT_CREATION_PRICE_HIVE = new Decimal(3);
const HIVE_PAYMENT_AMOUNT = ACCOUNT_CREATION_PRICE_HIVE.toFixed(3);
const HIVE_PAYMENT_CURRENCY = "HIVE";
const NATIVE_EVM_TOKEN_DECIMALS = 18;
const MAX_ERC20_TOKEN_DECIMALS = 255;

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

const validateEvmAddress = (address?: string | null) =>
  typeof address === "string" && isAddress(address);

const normalizeEvmAddress = (address: string) => address.trim().toLowerCase();

const validateTxHash = (txHash?: string) =>
  typeof txHash === "string" && /^0x[0-9a-fA-F]{64}$/.test(txHash.trim());

const assertUsernameAvailable = async (username: string) => {
  const accounts = await HiveUtils.getClient().database.getAccounts([username]);
  if (accounts.length > 0) {
    throw Object.assign(new Error("Username is unavailable."), {
      statusCode: 409,
    });
  }
};

const getHiveUsdPrice = () => {
  const hivePrice = PriceLogic.getHivePrices()?.hive as
    | { usd?: unknown }
    | undefined;
  const hiveUsd = hivePrice?.usd;
  if (typeof hiveUsd !== "number" || !Number.isFinite(hiveUsd) || hiveUsd <= 0) {
    throw Object.assign(new Error("HIVE price is unavailable."), {
      statusCode: 503,
    });
  }

  return new Decimal(hiveUsd.toString());
};

const getEvmPaymentTokenDecimals = (
  tokenAddress?: string | null,
  tokenDecimals?: number,
) => {
  if (!tokenAddress) return NATIVE_EVM_TOKEN_DECIMALS;
  if (
    !Number.isInteger(tokenDecimals) ||
    tokenDecimals! < 0 ||
    tokenDecimals! > MAX_ERC20_TOKEN_DECIMALS
  ) {
    throw Object.assign(new Error("Invalid EVM payment token decimals."), {
      statusCode: 400,
    });
  }

  return tokenDecimals!;
};

const formatTokenAmount = (amount: Decimal, decimals: number) => {
  return amount
    .toDecimalPlaces(decimals, Decimal.ROUND_UP)
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
};

const getHivePaymentQuote = async (): Promise<PaymentQuoteConfig> => {
  return {
    currency: HIVE_PAYMENT_CURRENCY,
    amount: HIVE_PAYMENT_AMOUNT,
    address: Config.accountCreation.paymentAccount,
  };
};

const getEvmPaymentQuote = async (
  chainId: string,
  tokenAddress?: string | null,
  payerEvmAddress?: string,
  tokenDecimals?: number,
): Promise<PaymentQuoteConfig> => {
  if (!Config.accountCreation.evmPaymentAddress) {
    throw Object.assign(new Error("EVM payment address is not configured."), {
      statusCode: 500,
    });
  }

  const paymentTokenDecimals = getEvmPaymentTokenDecimals(
    tokenAddress,
    tokenDecimals,
  );
  const price = await AccountCreationEvmPriceLogic.getLatestEvmPrice(
    chainId,
    tokenAddress,
  );
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

  const priceUsd = new Decimal(price.priceUsd);
  if (!priceUsd.isFinite() || !priceUsd.gt(0)) {
    throw Object.assign(new Error("Invalid EVM payment token price."), {
      statusCode: 502,
    });
  }
  const amount = ACCOUNT_CREATION_PRICE_HIVE.mul(getHiveUsdPrice()).div(priceUsd);

  return {
    currency: `EVM:${price.chainId}:${price.tokenAddress ?? "native"}`,
    amount: formatTokenAmount(amount, paymentTokenDecimals),
    address: Config.accountCreation.evmPaymentAddress,
    chainId: price.chainId,
    tokenAddress: price.tokenAddress,
    priceUsd: price.priceUsd,
    payerEvmAddress: normalizeEvmAddress(payerEvmAddress!),
  };
};

const getPaymentQuote = async (
  body: AccountCreationQuoteRequestBody,
): Promise<PaymentQuoteConfig> => {
  if (body.paymentChainId !== undefined && body.paymentChainId !== null) {
    return getEvmPaymentQuote(
      body.paymentChainId.toString(),
      body.paymentTokenAddress,
      body.payerEvmAddress,
      body.paymentTokenDecimals,
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
  payerEvmAddress: request.payerEvmAddress,
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
    paymentMemo: paymentQuote.chainId
      ? (paymentQuote.memo ?? null)
      : (paymentQuote.memo ?? buildPaymentMemo(requestId)),
    payerEvmAddress: paymentQuote.payerEvmAddress,
    expectedAmount: paymentQuote.amount,
    paidAmount: null,
    paymentTxId: null,
    accountCreationTxId: null,
    status: HiveAccountCreationStatus.PAYMENT_PENDING,
    expiresAt,
  };

  return buildQuoteResponse(await HiveAccountCreationRequestLogic.create(request));
};

const assertEvmPaymentRequest = (request: HiveAccountCreationRequest) => {
  if (!request.paymentChainId || !request.paymentCurrency.startsWith("EVM:")) {
    throw Object.assign(new Error("Request does not use EVM payment."), {
      statusCode: 400,
    });
  }
};

const assertPaymentTxCanBeSubmitted = (
  request: HiveAccountCreationRequest,
  body: AccountCreationPaymentTxRequestBody,
) => {
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

  if (
    body.from &&
    request.payerEvmAddress &&
    normalizeEvmAddress(body.from) !== request.payerEvmAddress
  ) {
    throw Object.assign(new Error("Payment transaction payer does not match."), {
      statusCode: 400,
    });
  }

  if (
    request.status === HiveAccountCreationStatus.EXPIRED ||
    request.status === HiveAccountCreationStatus.CANCELLED
  ) {
    throw Object.assign(new Error("Payment quote is no longer active."), {
      statusCode: 409,
    });
  }
};

const submitPaymentTx = async (
  requestId: string,
  body: AccountCreationPaymentTxRequestBody,
) => {
  const request = await HiveAccountCreationRequestLogic.getByRequestId(requestId);
  if (!request) return null;

  assertPaymentTxCanBeSubmitted(request, body);

  const updatedRequest = await HiveAccountCreationRequestLogic.assignPaymentTxId(
    request.requestId,
    body.txHash!.trim().toLowerCase(),
    HiveAccountCreationStatus.PAYMENT_CONFIRMING,
  );

  return updatedRequest ? buildStatusResponse(updatedRequest) : null;
};

const getStatus = async (requestId: string) => {
  const request = await HiveAccountCreationRequestLogic.getByRequestId(requestId);
  return request ? buildStatusResponse(request) : null;
};

const expirePendingQuotes = async (now = new Date()) => {
  return HiveAccountCreationRequestLogic.expirePendingRequests(now);
};

const processPaidAccountCreationRequests = async (
  detector?: AccountCreationPaymentDetector,
) => {
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
    const reconciliationResults =
      await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
        detector,
      );
    const accountCreationResults =
      await HiveAccountCreationServiceLogic.createAccountsForPaidRequests();

    return {
      skipped: false,
      reconciliationResults,
      accountCreationResults,
    };
  } catch (error) {
    safeLogError(
      `Hive account creation payment processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    throw error;
  } finally {
    paymentProcessingInProgress = false;
  }
};

const initExpiryJob = () => {
  if (expiryInterval) return;
  expirePendingQuotes();
  expiryInterval = setInterval(
    () => expirePendingQuotes(),
    Config.accountCreation.expiryCheckIntervalMs,
  );
};

const initPaymentProcessingJob = () => {
  if (paymentProcessingInterval) return;
  processPaidAccountCreationRequests().catch(() => undefined);
  paymentProcessingInterval = setInterval(
    () => processPaidAccountCreationRequests().catch(() => undefined),
    Config.accountCreation.paymentProcessingIntervalMs,
  );
};

const claimAccountCreationToken = async () => {
  try {
    const result =
      await HiveAccountCreationServiceLogic.attemptClaimAccountCreationToken();
    if (result === HiveAccountCreationTokenClaimResult.CLAIMED) {
      safeLogInfo(
        `Hive account creation token claimed for ${Config.accountCreation.creator.account}`,
      );
    }
    return result;
  } catch (error) {
    safeLogError(
      `Hive account creation token claim failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    throw error;
  }
};

const initAccountCreationTokenClaimJob = () => {
  if (tokenClaimInterval) return;
  claimAccountCreationToken().catch(() => undefined);
  tokenClaimInterval = setInterval(
    () => claimAccountCreationToken().catch(() => undefined),
    Config.accountCreation.tokenClaimIntervalMs,
  );
};

export const HiveAccountCreationLogic = {
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
