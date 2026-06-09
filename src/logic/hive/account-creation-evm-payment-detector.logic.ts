import fetch from "node-fetch";
import { formatEther } from "ethers";
import { Config } from "../../config";
import { HiveAccountCreationRequest } from "./account-creation-request.model";

export enum AccountCreationEvmPaymentDetectionType {
  NO_PAYMENT = "no_payment",
  PAYMENT_FOUND = "payment_found",
  WRONG_ASSET = "wrong_asset",
}

export interface AccountCreationEvmDetectedPayment {
  amount: string;
  currency: string;
  txId: string;
  confirmed: boolean;
  detectedAt: Date;
  blockNumber?: number;
}

export type AccountCreationEvmPaymentDetectionResult =
  | {
      type: AccountCreationEvmPaymentDetectionType.NO_PAYMENT;
    }
  | {
      type: AccountCreationEvmPaymentDetectionType.WRONG_ASSET;
      payment: AccountCreationEvmDetectedPayment;
    }
  | {
      type: AccountCreationEvmPaymentDetectionType.PAYMENT_FOUND;
      payment: AccountCreationEvmDetectedPayment;
    };

interface EvmHistoryResponse {
  items?: EvmHistoryItem[];
  latestBlockNumber?: number | string | null;
  indexedBlockNumber?: number | string | null;
  blockNumber?: number | string | null;
}

interface EvmHistoryItem {
  txId?: string;
  blockNumber?: number | string | null;
  blockTime?: string | null;
  fromAddress?: string | null;
  toAddress?: string | null;
  status?: string | number | null;
  txStatus?: string | number | null;
  in?: EvmHistoryFlow[];
}

interface EvmHistoryFlow {
  kind?: string;
  amount?: string;
  amountWei?: string;
  tokenAddress?: string;
}

const getBaseUrl = () =>
  (
    process.env.ACCOUNT_CREATION_EVM_LIGHT_NODE_URL ??
    Config.accountCreation.evmLightNode.baseUrl
  ).replace(/\/$/, "");

const getDecimalChainId = (chainId: string) => {
  const normalizedChainId = chainId.trim();
  if (/^0x[0-9a-f]+$/i.test(normalizedChainId)) {
    return BigInt(normalizedChainId).toString();
  }

  const numericChainId = Number(normalizedChainId);
  return Number.isFinite(numericChainId)
    ? String(Math.trunc(numericChainId))
    : normalizedChainId;
};

const buildHistoryUrl = (request: HiveAccountCreationRequest) => {
  const chainId = getDecimalChainId(request.paymentChainId!);
  const address = encodeURIComponent(request.paymentAddress!);
  return `${getBaseUrl()}/history/${chainId}/${address}?limit=${
    Config.accountCreation.evmPaymentDetection.historyLimit
  }&showPossibleSpam=true&showUnverified=true`;
};

const isEvmPaymentRequest = (request: HiveAccountCreationRequest) =>
  !!request.paymentChainId &&
  !!request.paymentAddress &&
  request.paymentCurrency.startsWith("EVM:");

const areSameAddress = (first?: string | null, second?: string | null) => {
  if (!first || !second) return false;
  return first.toLowerCase() === second.toLowerCase();
};

const isMatchingTxId = (item: EvmHistoryItem, txId: string) =>
  item.txId?.toLowerCase() === txId.toLowerCase();

const isSuccessfulTransaction = (item: EvmHistoryItem) => {
  const status = item.txStatus ?? item.status;
  if (status === undefined || status === null) return true;
  if (typeof status === "number") return status === 1;
  return status.toUpperCase() !== "REVERTED" && status !== "0";
};

const isFromExpectedPayer = (
  request: HiveAccountCreationRequest,
  item: EvmHistoryItem,
) =>
  !request.payerEvmAddress ||
  areSameAddress(item.fromAddress, request.payerEvmAddress);

const getNativeAmount = (flow: EvmHistoryFlow) => {
  if (flow.amount) return flow.amount;
  return flow.amountWei ? formatEther(flow.amountWei) : undefined;
};

const getErc20Amount = (
  flow: EvmHistoryFlow,
  tokenAddress: string,
): string | undefined => {
  if (!areSameAddress(flow.tokenAddress, tokenAddress)) return undefined;
  return flow.amount;
};

const getMatchingInboundAmount = (
  request: HiveAccountCreationRequest,
  item: EvmHistoryItem,
) => {
  const inboundFlows = item.in ?? [];
  for (const flow of inboundFlows) {
    if (flow.kind === "NATIVE" && !request.paymentTokenAddress) {
      const amount = getNativeAmount(flow);
      if (amount) return amount;
    }

    if (flow.kind === "ERC20" && request.paymentTokenAddress) {
      const amount = getErc20Amount(flow, request.paymentTokenAddress);
      if (amount) return amount;
    }
  }

  return undefined;
};

const getLatestBlockNumber = (response: EvmHistoryResponse) => {
  const blockNumber =
    response.latestBlockNumber ??
    response.indexedBlockNumber ??
    response.blockNumber ??
    null;
  if (blockNumber === null) return undefined;

  const numericBlockNumber = Number(blockNumber);
  return Number.isFinite(numericBlockNumber) ? numericBlockNumber : undefined;
};

const getItemBlockNumber = (item: EvmHistoryItem) => {
  const blockNumber = Number(item.blockNumber);
  return Number.isFinite(blockNumber) ? blockNumber : undefined;
};

const isConfirmed = (response: EvmHistoryResponse, item: EvmHistoryItem) => {
  const latestBlockNumber = getLatestBlockNumber(response);
  const blockNumber = getItemBlockNumber(item);
  if (!latestBlockNumber || !blockNumber) return true;

  return (
    latestBlockNumber - blockNumber + 1 >=
    Config.accountCreation.evmPaymentDetection.requiredConfirmations
  );
};

const getDetectedAt = (item: EvmHistoryItem) => {
  if (!item.blockTime) return new Date();
  const detectedAt = new Date(item.blockTime);
  return Number.isNaN(detectedAt.getTime()) ? new Date() : detectedAt;
};

const fetchTreasuryHistory = async (
  request: HiveAccountCreationRequest,
): Promise<EvmHistoryResponse | null> => {
  const response = await fetch(buildHistoryUrl(request));
  if (response.status === 404) return null;
  if (!response.ok) {
    throw Object.assign(new Error("Unable to verify EVM payment transaction."), {
      statusCode: 502,
    });
  }

  return (await response.json()) as EvmHistoryResponse;
};

const detectPayment = async (
  request: HiveAccountCreationRequest,
): Promise<AccountCreationEvmPaymentDetectionResult> => {
  if (!isEvmPaymentRequest(request) || !request.paymentTxId) {
    return { type: AccountCreationEvmPaymentDetectionType.NO_PAYMENT };
  }

  const history = await fetchTreasuryHistory(request);
  const item = history?.items?.find((historyItem) =>
    isMatchingTxId(historyItem, request.paymentTxId!),
  );
  if (!history || !item) {
    return { type: AccountCreationEvmPaymentDetectionType.NO_PAYMENT };
  }

  if (!isSuccessfulTransaction(item) || !isFromExpectedPayer(request, item)) {
    return {
      type: AccountCreationEvmPaymentDetectionType.WRONG_ASSET,
      payment: {
        amount: "0",
        currency: request.paymentCurrency,
        txId: request.paymentTxId,
        confirmed: false,
        detectedAt: getDetectedAt(item),
        blockNumber: getItemBlockNumber(item),
      },
    };
  }

  const amount = getMatchingInboundAmount(request, item);
  if (!amount) {
    return {
      type: AccountCreationEvmPaymentDetectionType.WRONG_ASSET,
      payment: {
        amount: "0",
        currency: request.paymentCurrency,
        txId: request.paymentTxId,
        confirmed: false,
        detectedAt: getDetectedAt(item),
        blockNumber: getItemBlockNumber(item),
      },
    };
  }

  const detectedPayment: AccountCreationEvmDetectedPayment = {
    amount,
    currency: request.paymentCurrency,
    txId: request.paymentTxId,
    confirmed: isConfirmed(history, item),
    detectedAt: getDetectedAt(item),
    blockNumber: getItemBlockNumber(item),
  };

  return {
    type: AccountCreationEvmPaymentDetectionType.PAYMENT_FOUND,
    payment: detectedPayment,
  };
};

export const AccountCreationEvmPaymentDetectorLogic = {
  detectPayment,
};
