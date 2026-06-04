"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifiLogic = void 0;
const sdk_1 = require("@lifi/sdk");
let lifiConfig;
let chains;
let tokens;
const initializeLifi = async () => {
    lifiConfig = await (0, sdk_1.createConfig)({
        integrator: "hive-keychain",
        // integrator: "li.fi-playground",
        apiKey: process.env.LIFI_API_KEY,
    });
    sdk_1.config.set(lifiConfig);
    setInterval(refreshChainsAndTokens, 1000 * 60 * 60);
    refreshChainsAndTokens();
};
const refreshChainsAndTokens = async () => {
    chains = await (0, sdk_1.getChains)({ chainTypes: [sdk_1.ChainType.EVM] });
    tokens = (await (0, sdk_1.getTokens)({ chainTypes: [sdk_1.ChainType.EVM], extended: true })).tokens;
};
const getChains = async () => {
    return chains;
};
const getTokens = async (chainId) => {
    return tokens.filter((token) => token.chainId === chainId);
};
const getAllTokens = async () => {
    const result = {};
    for (const chain of Object.keys(tokens)) {
        result[chain] = tokens[chain].filter((token) => token.volumeUSD24H > 200000);
    }
    return result;
};
const getQuote = async (params) => {
    try {
        const quote = await (0, sdk_1.getQuote)(params);
        console.log("[LIFI] Quote:", quote);
        return { result: quote, status: 200 };
    }
    catch (error) {
        console.log("[LIFI] Error:", error);
        return { errorCode: error.code, errorMessage: error.name, status: 200 };
    }
};
const buildStatusRequestFromTransfer = (transfer) => {
    const fullTransfer = transfer;
    if (fullTransfer.transactionId) {
        return { taskId: fullTransfer.transactionId };
    }
    if (!fullTransfer.sending?.txHash) {
        return undefined;
    }
    const request = { txHash: fullTransfer.sending.txHash };
    if (fullTransfer.tool) {
        request.bridge = fullTransfer.tool;
    }
    if (fullTransfer.sending?.chainId) {
        request.fromChain = fullTransfer.sending.chainId;
    }
    if (fullTransfer.receiving?.chainId) {
        request.toChain = fullTransfer.receiving.chainId;
    }
    if (fullTransfer.fromAddress) {
        request.fromAddress = fullTransfer.fromAddress;
    }
    return request;
};
const verifyTransferStatus = async (transfer) => {
    const request = buildStatusRequestFromTransfer(transfer);
    if (!request) {
        return {
            checked: false,
            consistent: null,
            error: "Missing taskId and txHash. Unable to verify transfer status.",
        };
    }
    try {
        const verified = await (0, sdk_1.getStatus)(request);
        return {
            checked: true,
            consistent: verified.status === transfer.status,
            status: verified.status,
            substatus: verified.substatus,
            details: verified,
        };
    }
    catch (error) {
        if ("txHash" in request && request.bridge) {
            const fallbackRequest = {
                txHash: request.txHash,
                fromChain: request.fromChain,
                toChain: request.toChain,
                fromAddress: request.fromAddress,
            };
            try {
                const verified = await (0, sdk_1.getStatus)(fallbackRequest);
                return {
                    checked: true,
                    consistent: verified.status === transfer.status,
                    status: verified.status,
                    substatus: verified.substatus,
                    details: verified,
                };
            }
            catch (fallbackError) {
                return {
                    checked: false,
                    consistent: null,
                    error: fallbackError?.message ??
                        "Unable to verify transfer status from LiFi.",
                };
            }
        }
        return {
            checked: false,
            consistent: null,
            error: error?.message ?? "Unable to verify transfer status.",
        };
    }
};
const normalizeStatus = (status) => {
    if (!status || status === "NOT_FOUND") {
        return "PENDING";
    }
    return status;
};
const pickSide = (side) => {
    if (!side) {
        return undefined;
    }
    return {
        token: side.token,
        chainId: side.chainId,
        amountUSD: side.amountUSD,
        amount: side.amount,
        timestamp: Number(side.timestamp) * 1000,
    };
};
const mapHistoryItem = (transfer, verifiedStatus, verifiedSubstatus) => {
    const fullTransfer = transfer;
    console.log("fullTransfer", fullTransfer);
    return {
        transactionId: fullTransfer.transactionId,
        lifiExplorerLink: fullTransfer.lifiExplorerLink,
        status: normalizeStatus(verifiedStatus ?? transfer.status),
        substatus: verifiedSubstatus ?? transfer.substatus,
        receiving: pickSide(fullTransfer.receiving),
        sending: pickSide(fullTransfer.sending),
    };
};
const getHistory = async (params) => {
    try {
        const history = await (0, sdk_1.getTransactionHistory)(params);
        const transfers = await Promise.all(history.transfers.map(async (transfer) => {
            const verification = await verifyTransferStatus(transfer);
            return mapHistoryItem(transfer, verification.status, verification.substatus);
        }));
        const result = { transfers };
        return {
            status: 200,
            result,
        };
    }
    catch (error) {
        console.log("[LIFI] History error:", error);
        return {
            status: 500,
            error: error?.message ?? "Error getting history",
        };
    }
};
exports.LifiLogic = {
    getQuote,
    initializeLifi,
    getChains,
    getTokens,
    getAllTokens,
    getHistory,
};
//# sourceMappingURL=lifi.logic.js.map