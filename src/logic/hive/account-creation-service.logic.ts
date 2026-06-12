import { Operation, PrivateKey } from "@hiveio/dhive";
import { Config } from "../../config";
import { HiveUtils } from "../../utils/hive.utils";
import { HiveAccountCreationRequestLogic } from "./account-creation-request.logic";
import {
  HiveAccountCreationRequest,
  HiveAccountCreationStatus,
} from "./account-creation-request.model";

export enum HiveAccountCreationServiceResult {
  ACCOUNT_CREATED = "account_created",
  ALREADY_CREATED = "already_created",
  ALREADY_PROCESSING = "already_processing",
  INELIGIBLE = "ineligible",
  REQUEST_NOT_FOUND = "request_not_found",
  USERNAME_UNAVAILABLE = "username_unavailable",
  ACCOUNT_CREATION_FAILED = "account_creation_failed",
}

export enum HiveAccountCreationTokenClaimResult {
  CLAIMED = "claimed",
  SKIPPED_NOT_CONFIGURED = "skipped_not_configured",
  ALREADY_IN_PROGRESS = "already_in_progress",
  CLAIM_FAILED = "claim_failed",
}

type HiveAccount = {
  name: string;
  owner?: { key_auths?: [unknown, number][] };
  active?: { key_auths?: [unknown, number][] };
  posting?: { key_auths?: [unknown, number][] };
  memo_key?: unknown;
  pending_claimed_accounts?: number | string;
};

const paidCreationStatuses = [
  HiveAccountCreationStatus.PAYMENT_DETECTED,
  HiveAccountCreationStatus.OVERPAID,
  HiveAccountCreationStatus.CREATING_ACCOUNT,
  HiveAccountCreationStatus.ACCOUNT_CREATION_FAILED,
];

const processingRequestIds = new Set<string>();
let tokenClaimInProgress = false;

const buildAuthority = (publicKey: string) => ({
  weight_threshold: 1,
  account_auths: [],
  key_auths: [[publicKey, 1]],
});

const hasExpectedAuthority = (
  authority: HiveAccount["owner"],
  publicKey: string,
) =>
  authority?.key_auths?.some(
    ([key, weight]) => key?.toString() === publicKey && Number(weight) >= 1,
  ) ?? false;

const accountMatchesRequestKeys = (
  account: HiveAccount,
  request: HiveAccountCreationRequest,
) =>
  hasExpectedAuthority(account.owner, request.ownerPublicKey) &&
  hasExpectedAuthority(account.active, request.activePublicKey) &&
  hasExpectedAuthority(account.posting, request.postingPublicKey) &&
  account.memo_key?.toString() === request.memoPublicKey;

const getAccount = async (username: string): Promise<HiveAccount | null> => {
  const [account] = await HiveUtils.getClient().database.getAccounts([username]);
  return (account as HiveAccount | undefined) ?? null;
};

const getCreatorAccount = async (creator: string): Promise<HiveAccount> => {
  const account = await getAccount(creator);
  if (!account) {
    throw new Error("Configured account creation creator account was not found.");
  }
  return account;
};

const getCreatorCredentials = () => {
  const { account, activePrivateKey } = Config.accountCreation.creator;
  if (!account || !activePrivateKey) {
    throw new Error("Account creation creator credentials are not configured.");
  }
  return {
    account,
    activePrivateKey: PrivateKey.fromString(activePrivateKey),
  };
};

const hasClaimedAccountToken = (account: HiveAccount) =>
  Number(account.pending_claimed_accounts ?? 0) > 0;

const buildCreateClaimedAccountOperation = (
  request: HiveAccountCreationRequest,
  creator: string,
): Operation => [
  "create_claimed_account",
  {
    creator,
    new_account_name: request.username,
    owner: buildAuthority(request.ownerPublicKey),
    active: buildAuthority(request.activePublicKey),
    posting: buildAuthority(request.postingPublicKey),
    memo_key: request.memoPublicKey,
    json_metadata: "",
    extensions: [],
  },
];

const buildPaidCreateAccountOperation = async (
  request: HiveAccountCreationRequest,
  creator: string,
): Promise<Operation> => {
  const chainProperties = await HiveUtils.getClient().database.getChainProperties();
  return [
    "account_create",
    {
      fee: chainProperties.account_creation_fee,
      creator,
      new_account_name: request.username,
      owner: buildAuthority(request.ownerPublicKey),
      active: buildAuthority(request.activePublicKey),
      posting: buildAuthority(request.postingPublicKey),
      memo_key: request.memoPublicKey,
      json_metadata: "",
    },
  ];
};

const isPaidCreationCandidate = (request: HiveAccountCreationRequest) => {
  if (!paidCreationStatuses.includes(request.status)) return false;
  if (!request.paidAmount || !request.paymentTxId) return false;

  const paidAmount = Number(request.paidAmount);
  const expectedAmount = Number(request.expectedAmount);
  return (
    Number.isFinite(paidAmount) &&
    Number.isFinite(expectedAmount) &&
    paidAmount >= expectedAmount
  );
};

const markExistingAccount = async (
  request: HiveAccountCreationRequest,
  account: HiveAccount,
) => {
  if (accountMatchesRequestKeys(account, request)) {
    await HiveAccountCreationRequestLogic.updateStatus(
      request.requestId,
      HiveAccountCreationStatus.ACCOUNT_CREATED,
    );
    return HiveAccountCreationServiceResult.ALREADY_CREATED;
  }

  await HiveAccountCreationRequestLogic.updateStatus(
    request.requestId,
    HiveAccountCreationStatus.USERNAME_UNAVAILABLE,
  );
  return HiveAccountCreationServiceResult.USERNAME_UNAVAILABLE;
};

const extractTransactionId = (confirmation: any): string | null =>
  confirmation?.id ?? confirmation?.trx_id ?? confirmation?.trxId ?? null;

const createAccountFromPaidRequestUnlocked = async (
  request: HiveAccountCreationRequest,
): Promise<HiveAccountCreationServiceResult> => {
  if (request.status === HiveAccountCreationStatus.ACCOUNT_CREATED) {
    return HiveAccountCreationServiceResult.ALREADY_CREATED;
  }

  if (!isPaidCreationCandidate(request)) {
    return HiveAccountCreationServiceResult.INELIGIBLE;
  }

  const existingAccount = await getAccount(request.username);
  if (existingAccount) return markExistingAccount(request, existingAccount);

  try {
    const { account: creator, activePrivateKey } = getCreatorCredentials();
    const creatorAccount = await getCreatorAccount(creator);
    const operation = hasClaimedAccountToken(creatorAccount)
      ? buildCreateClaimedAccountOperation(request, creator)
      : await buildPaidCreateAccountOperation(request, creator);

    await HiveAccountCreationRequestLogic.updateStatus(
      request.requestId,
      HiveAccountCreationStatus.CREATING_ACCOUNT,
    );

    const latestAccount = await getAccount(request.username);
    if (latestAccount) return markExistingAccount(request, latestAccount);

    const confirmation = await HiveUtils.getClient().broadcast.sendOperations(
      [operation],
      activePrivateKey,
    );
    const accountCreationTxId = extractTransactionId(confirmation);

    await HiveAccountCreationRequestLogic.updateStatus(
      request.requestId,
      HiveAccountCreationStatus.ACCOUNT_CREATED,
      { accountCreationTxId },
    );
    return HiveAccountCreationServiceResult.ACCOUNT_CREATED;
  } catch {
    try {
      const latestAccount = await getAccount(request.username);
      if (latestAccount) return markExistingAccount(request, latestAccount);
    } catch {
      // The failure status is safer than leaking RPC/broadcast details or retrying blindly.
    }

    await HiveAccountCreationRequestLogic.updateStatus(
      request.requestId,
      HiveAccountCreationStatus.ACCOUNT_CREATION_FAILED,
    );
    return HiveAccountCreationServiceResult.ACCOUNT_CREATION_FAILED;
  }
};

const createAccountFromPaidRequest = async (
  request: HiveAccountCreationRequest,
): Promise<HiveAccountCreationServiceResult> => {
  if (processingRequestIds.has(request.requestId)) {
    return HiveAccountCreationServiceResult.ALREADY_PROCESSING;
  }

  processingRequestIds.add(request.requestId);
  try {
    return await createAccountFromPaidRequestUnlocked(request);
  } finally {
    processingRequestIds.delete(request.requestId);
  }
};

const createAccountForRequestId = async (requestId: string) => {
  const request = await HiveAccountCreationRequestLogic.getByRequestId(requestId);
  if (!request) return HiveAccountCreationServiceResult.REQUEST_NOT_FOUND;
  return createAccountFromPaidRequest(request);
};

const createAccountsForPaidRequests = async () => {
  const requests = await HiveAccountCreationRequestLogic.getAccountCreationCandidates();
  return Promise.all(requests.map(createAccountFromPaidRequest));
};

const buildClaimAccountOperation = (creator: string): Operation => [
  "claim_account",
  {
    creator,
    fee: "0.000 HIVE",
    extensions: [],
  },
];

const attemptClaimAccountCreationToken = async (): Promise<HiveAccountCreationTokenClaimResult> => {
  const { account, activePrivateKey } = Config.accountCreation.creator;
  if (!account || !activePrivateKey) {
    return HiveAccountCreationTokenClaimResult.SKIPPED_NOT_CONFIGURED;
  }

  if (tokenClaimInProgress) {
    return HiveAccountCreationTokenClaimResult.ALREADY_IN_PROGRESS;
  }

  tokenClaimInProgress = true;
  try {
    await getCreatorAccount(account);
    await HiveUtils.getClient().broadcast.sendOperations(
      [buildClaimAccountOperation(account)],
      PrivateKey.fromString(activePrivateKey),
    );
    return HiveAccountCreationTokenClaimResult.CLAIMED;
  } catch {
    return HiveAccountCreationTokenClaimResult.CLAIM_FAILED;
  } finally {
    tokenClaimInProgress = false;
  }
};

export const HiveAccountCreationServiceLogic = {
  createAccountFromPaidRequest,
  createAccountForRequestId,
  createAccountsForPaidRequests,
  attemptClaimAccountCreationToken,
};
