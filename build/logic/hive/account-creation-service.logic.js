"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveAccountCreationServiceLogic = exports.HiveAccountCreationTokenClaimResult = exports.HiveAccountCreationServiceResult = void 0;
const dhive_1 = require("@hiveio/dhive");
const config_1 = require("../../config");
const hive_utils_1 = require("../../utils/hive.utils");
const account_creation_request_logic_1 = require("./account-creation-request.logic");
const account_creation_request_model_1 = require("./account-creation-request.model");
var HiveAccountCreationServiceResult;
(function (HiveAccountCreationServiceResult) {
    HiveAccountCreationServiceResult["ACCOUNT_CREATED"] = "account_created";
    HiveAccountCreationServiceResult["ALREADY_CREATED"] = "already_created";
    HiveAccountCreationServiceResult["ALREADY_PROCESSING"] = "already_processing";
    HiveAccountCreationServiceResult["INELIGIBLE"] = "ineligible";
    HiveAccountCreationServiceResult["REQUEST_NOT_FOUND"] = "request_not_found";
    HiveAccountCreationServiceResult["USERNAME_UNAVAILABLE"] = "username_unavailable";
    HiveAccountCreationServiceResult["ACCOUNT_CREATION_FAILED"] = "account_creation_failed";
})(HiveAccountCreationServiceResult || (exports.HiveAccountCreationServiceResult = HiveAccountCreationServiceResult = {}));
var HiveAccountCreationTokenClaimResult;
(function (HiveAccountCreationTokenClaimResult) {
    HiveAccountCreationTokenClaimResult["CLAIMED"] = "claimed";
    HiveAccountCreationTokenClaimResult["SKIPPED_NOT_CONFIGURED"] = "skipped_not_configured";
    HiveAccountCreationTokenClaimResult["ALREADY_IN_PROGRESS"] = "already_in_progress";
    HiveAccountCreationTokenClaimResult["CLAIM_FAILED"] = "claim_failed";
})(HiveAccountCreationTokenClaimResult || (exports.HiveAccountCreationTokenClaimResult = HiveAccountCreationTokenClaimResult = {}));
const paidCreationStatuses = [
    account_creation_request_model_1.HiveAccountCreationStatus.PAYMENT_DETECTED,
    account_creation_request_model_1.HiveAccountCreationStatus.OVERPAID,
    account_creation_request_model_1.HiveAccountCreationStatus.CREATING_ACCOUNT,
    account_creation_request_model_1.HiveAccountCreationStatus.ACCOUNT_CREATION_FAILED,
];
const processingRequestIds = new Set();
let tokenClaimInProgress = false;
const buildAuthority = (publicKey) => ({
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[publicKey, 1]],
});
const hasExpectedAuthority = (authority, publicKey) => authority?.key_auths?.some(([key, weight]) => key?.toString() === publicKey && Number(weight) >= 1) ?? false;
const accountMatchesRequestKeys = (account, request) => hasExpectedAuthority(account.owner, request.ownerPublicKey) &&
    hasExpectedAuthority(account.active, request.activePublicKey) &&
    hasExpectedAuthority(account.posting, request.postingPublicKey) &&
    account.memo_key?.toString() === request.memoPublicKey;
const getAccount = async (username) => {
    const [account] = await hive_utils_1.HiveUtils.getClient().database.getAccounts([username]);
    return account ?? null;
};
const getCreatorAccount = async (creator) => {
    const account = await getAccount(creator);
    if (!account) {
        throw new Error("Configured account creation creator account was not found.");
    }
    return account;
};
const getCreatorCredentials = () => {
    const { account, activePrivateKey } = config_1.Config.accountCreation.creator;
    if (!account || !activePrivateKey) {
        throw new Error("Account creation creator credentials are not configured.");
    }
    return {
        account,
        activePrivateKey: dhive_1.PrivateKey.fromString(activePrivateKey),
    };
};
const hasClaimedAccountToken = (account) => Number(account.pending_claimed_accounts ?? 0) > 0;
const buildCreateClaimedAccountOperation = (request, creator) => [
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
const buildPaidCreateAccountOperation = async (request, creator) => {
    const chainProperties = await hive_utils_1.HiveUtils.getClient().database.getChainProperties();
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
const isPaidCreationCandidate = (request) => {
    if (!paidCreationStatuses.includes(request.status))
        return false;
    if (!request.paidAmount || !request.paymentTxId)
        return false;
    const paidAmount = Number(request.paidAmount);
    const expectedAmount = Number(request.expectedAmount);
    return (Number.isFinite(paidAmount) &&
        Number.isFinite(expectedAmount) &&
        paidAmount >= expectedAmount);
};
const markExistingAccount = async (request, account) => {
    if (accountMatchesRequestKeys(account, request)) {
        await account_creation_request_logic_1.HiveAccountCreationRequestLogic.updateStatus(request.requestId, account_creation_request_model_1.HiveAccountCreationStatus.ACCOUNT_CREATED);
        return HiveAccountCreationServiceResult.ALREADY_CREATED;
    }
    await account_creation_request_logic_1.HiveAccountCreationRequestLogic.updateStatus(request.requestId, account_creation_request_model_1.HiveAccountCreationStatus.USERNAME_UNAVAILABLE);
    return HiveAccountCreationServiceResult.USERNAME_UNAVAILABLE;
};
const extractTransactionId = (confirmation) => confirmation?.id ?? confirmation?.trx_id ?? confirmation?.trxId ?? null;
const createAccountFromPaidRequestUnlocked = async (request) => {
    if (request.status === account_creation_request_model_1.HiveAccountCreationStatus.ACCOUNT_CREATED) {
        return HiveAccountCreationServiceResult.ALREADY_CREATED;
    }
    if (!isPaidCreationCandidate(request)) {
        return HiveAccountCreationServiceResult.INELIGIBLE;
    }
    const existingAccount = await getAccount(request.username);
    if (existingAccount)
        return markExistingAccount(request, existingAccount);
    try {
        const { account: creator, activePrivateKey } = getCreatorCredentials();
        const creatorAccount = await getCreatorAccount(creator);
        const operation = hasClaimedAccountToken(creatorAccount)
            ? buildCreateClaimedAccountOperation(request, creator)
            : await buildPaidCreateAccountOperation(request, creator);
        await account_creation_request_logic_1.HiveAccountCreationRequestLogic.updateStatus(request.requestId, account_creation_request_model_1.HiveAccountCreationStatus.CREATING_ACCOUNT);
        const latestAccount = await getAccount(request.username);
        if (latestAccount)
            return markExistingAccount(request, latestAccount);
        const confirmation = await hive_utils_1.HiveUtils.getClient().broadcast.sendOperations([operation], activePrivateKey);
        const accountCreationTxId = extractTransactionId(confirmation);
        await account_creation_request_logic_1.HiveAccountCreationRequestLogic.updateStatus(request.requestId, account_creation_request_model_1.HiveAccountCreationStatus.ACCOUNT_CREATED, { accountCreationTxId });
        return HiveAccountCreationServiceResult.ACCOUNT_CREATED;
    }
    catch {
        try {
            const latestAccount = await getAccount(request.username);
            if (latestAccount)
                return markExistingAccount(request, latestAccount);
        }
        catch {
            // The failure status is safer than leaking RPC/broadcast details or retrying blindly.
        }
        await account_creation_request_logic_1.HiveAccountCreationRequestLogic.updateStatus(request.requestId, account_creation_request_model_1.HiveAccountCreationStatus.ACCOUNT_CREATION_FAILED);
        return HiveAccountCreationServiceResult.ACCOUNT_CREATION_FAILED;
    }
};
const createAccountFromPaidRequest = async (request) => {
    if (processingRequestIds.has(request.requestId)) {
        return HiveAccountCreationServiceResult.ALREADY_PROCESSING;
    }
    processingRequestIds.add(request.requestId);
    try {
        return await createAccountFromPaidRequestUnlocked(request);
    }
    finally {
        processingRequestIds.delete(request.requestId);
    }
};
const createAccountForRequestId = async (requestId) => {
    const request = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getByRequestId(requestId);
    if (!request)
        return HiveAccountCreationServiceResult.REQUEST_NOT_FOUND;
    return createAccountFromPaidRequest(request);
};
const createAccountsForPaidRequests = async () => {
    const requests = await account_creation_request_logic_1.HiveAccountCreationRequestLogic.getAccountCreationCandidates();
    return Promise.all(requests.map(createAccountFromPaidRequest));
};
const buildClaimAccountOperation = (creator) => [
    "claim_account",
    {
        creator,
        fee: "0.000 HIVE",
        extensions: [],
    },
];
const attemptClaimAccountCreationToken = async () => {
    const { account, activePrivateKey } = config_1.Config.accountCreation.creator;
    if (!account || !activePrivateKey) {
        return HiveAccountCreationTokenClaimResult.SKIPPED_NOT_CONFIGURED;
    }
    if (tokenClaimInProgress) {
        return HiveAccountCreationTokenClaimResult.ALREADY_IN_PROGRESS;
    }
    tokenClaimInProgress = true;
    try {
        await getCreatorAccount(account);
        await hive_utils_1.HiveUtils.getClient().broadcast.sendOperations([buildClaimAccountOperation(account)], dhive_1.PrivateKey.fromString(activePrivateKey));
        return HiveAccountCreationTokenClaimResult.CLAIMED;
    }
    catch {
        return HiveAccountCreationTokenClaimResult.CLAIM_FAILED;
    }
    finally {
        tokenClaimInProgress = false;
    }
};
exports.HiveAccountCreationServiceLogic = {
    createAccountFromPaidRequest,
    createAccountForRequestId,
    createAccountsForPaidRequests,
    attemptClaimAccountCreationToken,
};
//# sourceMappingURL=account-creation-service.logic.js.map