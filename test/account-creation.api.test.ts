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
