import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test, { beforeEach } from "node:test";
import bodyParser from "body-parser";
import express from "express";
import { PrivateKey } from "@hiveio/dhive";

const requestStorePath = path.join(
  os.tmpdir(),
  "hive-account-creation-requests-test.json",
);
process.env.HIVE_ACCOUNT_CREATION_REQUESTS_FILE = requestStorePath;
process.env.ACCOUNT_CREATION_PAYMENT_ACCOUNT = "keychain-test";
process.env.ACCOUNT_CREATION_EVM_PAYMENT_ADDRESS =
  "0x1111111111111111111111111111111111111111";
process.env.ACCOUNT_CREATION_EVM_QUOTE_AMOUNT_USD = "3";
process.env.ACCOUNT_CREATION_CREATOR_ACCOUNT = "creator-test";
process.env.ACCOUNT_CREATION_CREATOR_ACTIVE_PRIVATE_KEY =
  PrivateKey.fromSeed("account-creation-test").toString();

const { AccountCreationApi } = require("../src/api/hive/account-creation.api");
const { HiveAccountCreationLogic } = require("../src/logic/hive/account-creation.logic");
const {
  HiveAccountCreationReconciliationLogic,
  AccountCreationPaymentClassification,
} = require("../src/logic/hive/account-creation-reconciliation.logic");
const {
  HiveAccountCreationServiceLogic,
  HiveAccountCreationServiceResult,
} = require("../src/logic/hive/account-creation-service.logic");
const {
  AccountCreationPaymentDetectionType,
  HiveAccountCreationPaymentDetector,
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

const startMockEvmPriceServer = async (
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
) => {
  const server = http.createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Mock EVM price server did not start.");
  }
  process.env.ACCOUNT_CREATION_EVM_LIGHT_NODE_URL = `http://127.0.0.1:${address.port}`;
  return server;
};

const closeServer = async (server: http.Server) => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
};

const mockHiveClient = (
  accounts: unknown[] | Record<string, unknown> = [],
  options: {
    accountHistory?: unknown[];
    lastIrreversibleBlockNum?: number;
    broadcastResult?: unknown;
    broadcastError?: Error;
    onBroadcast?: (operations: unknown[]) => void;
  } = {},
) => {
  (HiveUtils as any).getClient = () => ({
    database: {
      getAccounts: async (usernames: string[]) => {
        if (Array.isArray(accounts)) return accounts;
        return usernames
          .map((username) => accounts[username])
          .filter((account) => account !== undefined);
      },
      getChainProperties: async () => ({
        account_creation_fee: "3.000 HIVE",
      }),
      getAccountHistory: async () => options.accountHistory ?? [],
      getDynamicGlobalProperties: async () => ({
        last_irreversible_block_num: options.lastIrreversibleBlockNum ?? 0,
      }),
    },
    broadcast: {
      sendOperations: async (operations: unknown[]) => {
        options.onBroadcast?.(operations);
        if (options.broadcastError) throw options.broadcastError;
        return options.broadcastResult ?? { id: "account-creation-tx" };
      },
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

const matchingHiveAccount = (name: string, overrides: Record<string, unknown> = {}) => ({
  name,
  owner: { key_auths: [[validPublicKey, 1]] },
  active: { key_auths: [[validPublicKey, 1]] },
  posting: { key_auths: [[validPublicKey, 1]] },
  memo_key: validPublicKey,
  ...overrides,
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

const hiveTransferHistoryItem = (overrides: Record<string, unknown> = {}) => [
  1,
  {
    trx_id: "hive-payment-tx",
    block: 100,
    timestamp: "2026-04-28T04:00:00",
    op: [
      "transfer",
      {
        from: "payer",
        to: "keychain-test",
        amount: "3.000 HIVE",
        memo: "account-creation:memo",
        ...overrides,
      },
    ],
  },
];

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

test("POST /hive/account-creation/quote accepts EVM token-chain pair with price", async () => {
  const server = await startMockEvmPriceServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        chainId: "1",
        tokenAddress: "0xabc",
        priceUsd: 1.5,
        fetchedAt: "2026-04-28T04:00:00.000Z",
      }),
    );
  });

  try {
    const response = await request(
      buildApp(),
      "POST",
      "/hive/account-creation/quote",
      {
        ...quoteBody,
        paymentCurrency: undefined,
        paymentChainId: "1",
        paymentTokenAddress: "0xabc",
      },
    );

    assert.equal(response.status, 201);
    assert.equal(response.body.amount, "2");
    assert.equal(response.body.currency, "EVM:1:0xabc");
    assert.equal(response.body.chainId, "1");
    assert.equal(response.body.tokenAddress, "0xabc");
    assert.equal(response.body.priceUsd, "1.5");
    assert.equal(
      response.body.address,
      "0x1111111111111111111111111111111111111111",
    );
  } finally {
    await closeServer(server);
  }
});

test("POST /hive/account-creation/quote rejects EVM token-chain pair without price", async () => {
  const server = await startMockEvmPriceServer((_req, res) => {
    res.statusCode = 404;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Price not found" }));
  });

  try {
    const response = await request(
      buildApp(),
      "POST",
      "/hive/account-creation/quote",
      {
        ...quoteBody,
        paymentCurrency: undefined,
        paymentChainId: "1",
        paymentTokenAddress: "0xabc",
      },
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Unsupported EVM payment token.");
  } finally {
    await closeServer(server);
  }
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

test("reconciliation leaves unconfirmed overpayments confirming", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest(),
  );

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments(
      mockPaymentDetector(paymentFound({ amount: "4.000", confirmed: false })),
    );
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(
    result.classification,
    AccountCreationPaymentClassification.PAYMENT_CONFIRMING,
  );
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

test("HIVE detector finds a confirmed transfer by payment account and memo", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      paymentMemo: "account-creation:memo",
    }),
  );
  mockHiveClient([], {
    accountHistory: [hiveTransferHistoryItem()],
    lastIrreversibleBlockNum: 100,
  });

  const result =
    await HiveAccountCreationPaymentDetector.detectPayment(storedRequest);

  assert.equal(result.type, AccountCreationPaymentDetectionType.PAYMENT_FOUND);
  assert.equal(result.payment.amount, "3.000");
  assert.equal(result.payment.currency, "HIVE");
  assert.equal(result.payment.txId, "hive-payment-tx");
  assert.equal(result.payment.confirmed, true);
  assert.equal(result.payment.blockNumber, 100);
});

test("HIVE detector marks matching transfer unconfirmed until confirmation policy is met", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      paymentMemo: "account-creation:memo",
    }),
  );
  mockHiveClient([], {
    accountHistory: [hiveTransferHistoryItem()],
    lastIrreversibleBlockNum: 99,
  });

  const result =
    await HiveAccountCreationPaymentDetector.detectPayment(storedRequest);

  assert.equal(result.type, AccountCreationPaymentDetectionType.PAYMENT_FOUND);
  assert.equal(result.payment.confirmed, false);
});

test("HIVE detector ignores transfers without the request memo", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      paymentMemo: "account-creation:memo",
    }),
  );
  mockHiveClient([], {
    accountHistory: [
      hiveTransferHistoryItem({
        memo: "account-creation:another-request",
      }),
    ],
    lastIrreversibleBlockNum: 100,
  });

  const result =
    await HiveAccountCreationPaymentDetector.detectPayment(storedRequest);

  assert.equal(result.type, AccountCreationPaymentDetectionType.NO_PAYMENT);
});

test("HIVE detector reports wrong asset for matching memo with unsupported asset", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      paymentMemo: "account-creation:memo",
    }),
  );
  mockHiveClient([], {
    accountHistory: [
      hiveTransferHistoryItem({
        amount: "3.000 HBD",
      }),
    ],
    lastIrreversibleBlockNum: 100,
  });

  const result =
    await HiveAccountCreationPaymentDetector.detectPayment(storedRequest);

  assert.equal(result.type, AccountCreationPaymentDetectionType.WRONG_ASSET);
  assert.equal(result.payment.currency, "HBD");
});

test("reconciliation uses the HIVE detector by default", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      paymentMemo: "account-creation:memo",
    }),
  );
  mockHiveClient([], {
    accountHistory: [hiveTransferHistoryItem()],
    lastIrreversibleBlockNum: 100,
  });

  const [result] =
    await HiveAccountCreationReconciliationLogic.reconcilePendingPayments();
  const reconciledRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result.classification, AccountCreationPaymentClassification.FULL_PAYMENT);
  assert.equal(reconciledRequest.status, HiveAccountCreationStatus.PAYMENT_DETECTED);
  assert.equal(reconciledRequest.paymentTxId, "hive-payment-tx");
});

test("account creation service uses a claimed account token when available", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      status: HiveAccountCreationStatus.PAYMENT_DETECTED,
      paidAmount: "3.000",
      paymentTxId: "payment-tx",
    }),
  );
  let broadcastOperations: any[] = [];
  mockHiveClient(
    {
      "creator-test": matchingHiveAccount("creator-test", {
        pending_claimed_accounts: 1,
      }),
    },
    {
      broadcastResult: { id: "claimed-account-tx" },
      onBroadcast: (operations) => {
        broadcastOperations = operations as any[];
      },
    },
  );

  const result = await HiveAccountCreationServiceLogic.createAccountForRequestId(
    storedRequest.requestId,
  );
  const createdRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result, HiveAccountCreationServiceResult.ACCOUNT_CREATED);
  assert.equal(createdRequest.status, HiveAccountCreationStatus.ACCOUNT_CREATED);
  assert.equal(createdRequest.accountCreationTxId, "claimed-account-tx");
  assert.equal(broadcastOperations[0][0], "create_claimed_account");
  assert.equal(broadcastOperations[0][1].creator, "creator-test");
  assert.equal(broadcastOperations[0][1].new_account_name, storedRequest.username);
  assert.equal(
    broadcastOperations[0][1].owner.key_auths[0][0],
    storedRequest.ownerPublicKey,
  );
});

test("account creation service falls back to paying the creation fee", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      status: HiveAccountCreationStatus.PAYMENT_DETECTED,
      paidAmount: "3.000",
      paymentTxId: "payment-tx",
    }),
  );
  let broadcastOperations: any[] = [];
  mockHiveClient(
    {
      "creator-test": matchingHiveAccount("creator-test", {
        pending_claimed_accounts: 0,
      }),
    },
    {
      onBroadcast: (operations) => {
        broadcastOperations = operations as any[];
      },
    },
  );

  const result = await HiveAccountCreationServiceLogic.createAccountForRequestId(
    storedRequest.requestId,
  );

  assert.equal(result, HiveAccountCreationServiceResult.ACCOUNT_CREATED);
  assert.equal(broadcastOperations[0][0], "account_create");
  assert.equal(broadcastOperations[0][1].fee, "3.000 HIVE");
});

test("account creation service marks taken mismatched usernames unavailable", async () => {
  const otherPublicKey = PrivateKey.fromSeed("other-account").createPublic().toString();
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      status: HiveAccountCreationStatus.PAYMENT_DETECTED,
      paidAmount: "3.000",
      paymentTxId: "payment-tx",
    }),
  );
  let broadcastCount = 0;
  mockHiveClient(
    {
      [storedRequest.username]: matchingHiveAccount(storedRequest.username, {
        owner: { key_auths: [[otherPublicKey, 1]] },
      }),
      "creator-test": matchingHiveAccount("creator-test", {
        pending_claimed_accounts: 1,
      }),
    },
    {
      onBroadcast: () => {
        broadcastCount++;
      },
    },
  );

  const result = await HiveAccountCreationServiceLogic.createAccountForRequestId(
    storedRequest.requestId,
  );
  const updatedRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result, HiveAccountCreationServiceResult.USERNAME_UNAVAILABLE);
  assert.equal(updatedRequest.status, HiveAccountCreationStatus.USERNAME_UNAVAILABLE);
  assert.equal(broadcastCount, 0);
});

test("account creation service is idempotent when the account already matches", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      status: HiveAccountCreationStatus.CREATING_ACCOUNT,
      paidAmount: "3.000",
      paymentTxId: "payment-tx",
    }),
  );
  let broadcastCount = 0;
  mockHiveClient(
    {
      [storedRequest.username]: matchingHiveAccount(storedRequest.username),
      "creator-test": matchingHiveAccount("creator-test", {
        pending_claimed_accounts: 1,
      }),
    },
    {
      onBroadcast: () => {
        broadcastCount++;
      },
    },
  );

  const result = await HiveAccountCreationServiceLogic.createAccountForRequestId(
    storedRequest.requestId,
  );
  const updatedRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result, HiveAccountCreationServiceResult.ALREADY_CREATED);
  assert.equal(updatedRequest.status, HiveAccountCreationStatus.ACCOUNT_CREATED);
  assert.equal(broadcastCount, 0);
});

test("account creation service does not process unpaid requests", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest(),
  );
  let broadcastCount = 0;
  mockHiveClient(
    {
      [storedRequest.username]: matchingHiveAccount(storedRequest.username),
      "creator-test": matchingHiveAccount("creator-test", {
        pending_claimed_accounts: 1,
      }),
    },
    {
      onBroadcast: () => {
        broadcastCount++;
      },
    },
  );

  const result = await HiveAccountCreationServiceLogic.createAccountForRequestId(
    storedRequest.requestId,
  );
  const updatedRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result, HiveAccountCreationServiceResult.INELIGIBLE);
  assert.equal(updatedRequest.status, HiveAccountCreationStatus.PAYMENT_PENDING);
  assert.equal(broadcastCount, 0);
});

test("account creation service marks safe broadcast failures", async () => {
  const storedRequest = await HiveAccountCreationRequestLogic.create(
    buildStoredRequest({
      status: HiveAccountCreationStatus.PAYMENT_DETECTED,
      paidAmount: "3.000",
      paymentTxId: "payment-tx",
    }),
  );
  mockHiveClient(
    {
      "creator-test": matchingHiveAccount("creator-test", {
        pending_claimed_accounts: 1,
      }),
    },
    {
      broadcastError: new Error("broadcast failed"),
    },
  );

  const result = await HiveAccountCreationServiceLogic.createAccountForRequestId(
    storedRequest.requestId,
  );
  const updatedRequest = await HiveAccountCreationRequestLogic.getByRequestId(
    storedRequest.requestId,
  );

  assert.equal(result, HiveAccountCreationServiceResult.ACCOUNT_CREATION_FAILED);
  assert.equal(
    updatedRequest.status,
    HiveAccountCreationStatus.ACCOUNT_CREATION_FAILED,
  );
  assert.equal(updatedRequest.accountCreationTxId, null);
});
