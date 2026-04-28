import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test, { beforeEach } from "node:test";
import bodyParser from "body-parser";
import express from "express";

const requestStorePath = path.join(
  os.tmpdir(),
  "hive-account-creation-requests-test.json",
);
process.env.HIVE_ACCOUNT_CREATION_REQUESTS_FILE = requestStorePath;
process.env.ACCOUNT_CREATION_PAYMENT_ACCOUNT = "keychain-test";

const { AccountCreationApi } = require("../src/api/hive/account-creation.api");
const { HiveAccountCreationLogic } = require("../src/logic/hive/account-creation.logic");
const {
  HiveAccountCreationReconciliationLogic,
  AccountCreationPaymentClassification,
} = require("../src/logic/hive/account-creation-reconciliation.logic");
const {
  AccountCreationPaymentDetectionType,
} = require("../src/logic/hive/account-creation-payment-detector");
const { HiveAccountCreationRequestLogic } = require("../src/logic/hive/account-creation-request.logic");
const { HiveAccountCreationStatus } = require("../src/logic/hive/account-creation-request.model");
const { HiveUtils } = require("../src/utils/hive.utils");

const validPublicKey =
  "STM5cYvx6NBYNdcJUym9WydRRs6329UTzJgzKii8dESmw2ZaA4fEH";

const buildApp = () => {
  const app = express();
  app.use(bodyParser.json());
  AccountCreationApi.setupApis(app);
  return app;
};

const request = async (
  app: express.Express,
  method: string,
  pathname: string,
  body?: unknown,
) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not start.");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${pathname}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json: any = await response.json();
    return { status: response.status, body: json };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
};

const mockHiveClient = (accounts: unknown[] = []) => {
  (HiveUtils as any).getClient = () => ({
    database: {
      getAccounts: async () => accounts,
      getChainProperties: async () => ({
        account_creation_fee: "3.000 HIVE",
      }),
    },
  });
};

const quoteBody = {
  username: "new-account",
  ownerPublicKey: validPublicKey,
  activePublicKey: validPublicKey,
  postingPublicKey: validPublicKey,
  memoPublicKey: validPublicKey,
  paymentCurrency: "HIVE",
};

const buildStoredRequest = (overrides: Record<string, unknown> = {}) => ({
  requestId: cryptoRandomId(),
  username: "new-account",
  ownerPublicKey: validPublicKey,
  activePublicKey: validPublicKey,
  postingPublicKey: validPublicKey,
  memoPublicKey: validPublicKey,
  paymentCurrency: "HIVE",
  paymentAddress: "keychain-test",
  paymentMemo: `account-creation:${cryptoRandomId()}`,
  expectedAmount: "3.000",
  paidAmount: null,
  paymentTxId: null,
  accountCreationTxId: null,
  status: HiveAccountCreationStatus.PAYMENT_PENDING,
  expiresAt: new Date(Date.now() + 60000),
  ...overrides,
});

const cryptoRandomId = () => Math.random().toString(36).slice(2);

const mockPaymentDetector = (result: unknown) => ({
  detectPayment: async () => result,
});

const paymentFound = (overrides: Record<string, unknown> = {}) => ({
  type: AccountCreationPaymentDetectionType.PAYMENT_FOUND,
  payment: {
    amount: "3.000",
    currency: "HIVE",
    txId: `payment-${cryptoRandomId()}`,
    confirmed: true,
    detectedAt: new Date(),
    ...overrides,
  },
});

beforeEach(() => {
  fs.writeFileSync(requestStorePath, "[]");
  mockHiveClient();
});

test("POST /hive/account-creation/quote creates a payment pending quote", async () => {
  const response = await request(
    buildApp(),
    "POST",
    "/hive/account-creation/quote",
    quoteBody,
  );

  assert.equal(response.status, 201);
  assert.equal(response.body.status, HiveAccountCreationStatus.PAYMENT_PENDING);
  assert.equal(response.body.username, quoteBody.username);
  assert.equal(response.body.amount, "3.000");
  assert.equal(response.body.currency, "HIVE");
  assert.equal(response.body.address, "keychain-test");
  assert.match(response.body.memo, /^account-creation:/);
  assert.ok(response.body.requestId);
  assert.ok(response.body.expiresAt);
});

test("POST /hive/account-creation/quote rejects unavailable usernames", async () => {
  mockHiveClient([{ name: quoteBody.username }]);

  const response = await request(
    buildApp(),
    "POST",
    "/hive/account-creation/quote",
    quoteBody,
  );

  assert.equal(response.status, 409);
  assert.equal(response.body.error, "Username is unavailable.");
});

test("POST /hive/account-creation/quote rejects invalid usernames", async () => {
  const response = await request(
    buildApp(),
    "POST",
    "/hive/account-creation/quote",
    { ...quoteBody, username: "Invalid_Account" },
  );

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid username format.");
});

test("POST /hive/account-creation/quote rejects invalid public keys", async () => {
  const response = await request(
    buildApp(),
    "POST",
    "/hive/account-creation/quote",
    { ...quoteBody, ownerPublicKey: "not-a-public-key" },
  );

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid public key.");
});

test("GET /hive/account-creation/:requestId returns safe request status", async () => {
  const app = buildApp();
  const quote = await request(
    app,
    "POST",
    "/hive/account-creation/quote",
    quoteBody,
  );
  const status = await request(
    app,
    "GET",
    `/hive/account-creation/${quote.body.requestId}`,
  );

  assert.equal(status.status, 200);
  assert.equal(status.body.requestId, quote.body.requestId);
  assert.equal(status.body.status, HiveAccountCreationStatus.PAYMENT_PENDING);
  assert.equal(status.body.payment.amount, "3.000");
  assert.equal(status.body.payment.currency, "HIVE");
  assert.equal(status.body.payment.address, "keychain-test");
  assert.equal(status.body.payment.memo, quote.body.memo);
  assert.equal(status.body.ownerPublicKey, undefined);
  assert.equal(status.body.activePublicKey, undefined);
  assert.equal(status.body.postingPublicKey, undefined);
  assert.equal(status.body.memoPublicKey, undefined);
});

test("expiry job expires unpaid payment pending quotes", async () => {
  const expiredRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      expiresAt: new Date(Date.now() - 60000),
    }),
  );

  const expiredCount = await HiveAccountCreationLogic.expirePendingQuotes(
    new Date(),
  );
  const storedRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    expiredRequest.requestId,
  );

  assert.equal(expiredCount, 1);
  assert.equal(storedRequest.status, HiveAccountCreationStatus.EXPIRED);
});

test("expiry job does not expire detected paid quotes", async () => {
  const detectedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      status: HiveAccountCreationStatus.PAYMENT_DETECTED,
      paidAmount: "3.000",
      paymentTxId: "payment-tx",
      expiresAt: new Date(Date.now() - 60000),
    }),
  );

  const expiredCount = await HiveAccountCreationLogic.expirePendingQuotes(
    new Date(),
  );
  const storedRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    detectedRequest.requestId,
  );

  assert.equal(expiredCount, 0);
  assert.equal(storedRequest.status, HiveAccountCreationStatus.PAYMENT_DETECTED);
});

test("expiry job is safe when run repeatedly", async () => {
  const expiredRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      expiresAt: new Date(Date.now() - 60000),
    }),
  );

  const firstExpiredCount = await HiveAccountCreationLogic.expirePendingQuotes(
    new Date(),
  );
  const secondExpiredCount = await HiveAccountCreationLogic.expirePendingQuotes(
    new Date(),
  );
  const storedRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    expiredRequest.requestId,
  );

  assert.equal(firstExpiredCount, 1);
  assert.equal(secondExpiredCount, 0);
  assert.equal(storedRequest.status, HiveAccountCreationStatus.EXPIRED);
});

test("reconciliation leaves requests unchanged when no payment is found", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest(),
  );

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
      mockPaymentDetector({
        type: AccountCreationPaymentDetectionType.NO_PAYMENT,
      }),
    );
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result.classification, AccountCreationPaymentClassification.NO_PAYMENT);
  assert.equal(result.updated, false);
  assert.equal(
    reconciledRequest.status,
    HiveAccountCreationStatus.PAYMENT_PENDING,
  );
});

test("reconciliation marks exact confirmed payments as detected", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest(),
  );

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
      mockPaymentDetector(paymentFound({ amount: "3.000", confirmed: true })),
    );
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result.classification, AccountCreationPaymentClassification.FULL_PAYMENT);
  assert.equal(result.updated, true);
  assert.equal(
    reconciledRequest.status,
    HiveAccountCreationStatus.PAYMENT_DETECTED,
  );
  assert.equal(reconciledRequest.paidAmount, "3.000");
});

test("reconciliation marks exact unconfirmed payments as confirming", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest(),
  );

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
      mockPaymentDetector(paymentFound({ amount: "3.000", confirmed: false })),
    );
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(
    result.classification,
    AccountCreationPaymentClassification.PAYMENT_CONFIRMING,
  );
  assert.equal(result.updated, true);
  assert.equal(
    reconciledRequest.status,
    HiveAccountCreationStatus.PAYMENT_CONFIRMING,
  );
});

test("reconciliation marks underpayments", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest(),
  );

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
      mockPaymentDetector(paymentFound({ amount: "2.000" })),
    );
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result.classification, AccountCreationPaymentClassification.UNDERPAYMENT);
  assert.equal(reconciledRequest.status, HiveAccountCreationStatus.UNDERPAID);
  assert.equal(reconciledRequest.paidAmount, "2.000");
});

test("reconciliation marks overpayments", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest(),
  );

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
      mockPaymentDetector(paymentFound({ amount: "4.000" })),
    );
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result.classification, AccountCreationPaymentClassification.OVERPAYMENT);
  assert.equal(reconciledRequest.status, HiveAccountCreationStatus.OVERPAID);
  assert.equal(reconciledRequest.paidAmount, "4.000");
});

test("reconciliation marks payments detected after expiry", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      expiresAt: new Date(Date.now() - 60000),
    }),
  );

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
      mockPaymentDetector(paymentFound({ detectedAt: new Date() })),
    );
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(
    result.classification,
    AccountCreationPaymentClassification.PAYMENT_AFTER_EXPIRY,
  );
  assert.equal(
    reconciledRequest.status,
    HiveAccountCreationStatus.PAID_AFTER_EXPIRY,
  );
});

test("reconciliation ignores unsupported payment assets", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest(),
  );

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
      mockPaymentDetector(paymentFound({ currency: "HBD" })),
    );
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result.classification, AccountCreationPaymentClassification.WRONG_ASSET);
  assert.equal(result.updated, false);
  assert.equal(
    reconciledRequest.status,
    HiveAccountCreationStatus.PAYMENT_PENDING,
  );
});
