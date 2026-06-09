import { Config } from "../../config";
import { HiveUtils } from "../../utils/hive.utils";
import {
  AccountCreationEvmPaymentDetectionType,
  AccountCreationEvmPaymentDetectorLogic,
} from "./account-creation-evm-payment-detector.logic";
import { HiveAccountCreationRequest } from "./account-creation-request.model";

export enum AccountCreationPaymentDetectionType {
  NO_PAYMENT = "no_payment",
  PAYMENT_FOUND = "payment_found",
  WRONG_ASSET = "wrong_asset",
}

export interface AccountCreationDetectedPayment {
  amount: string;
  currency: string;
  txId: string;
  confirmed: boolean;
  detectedAt: Date;
  blockNumber?: number;
}

export type AccountCreationPaymentDetectionResult =
  | {
      type: AccountCreationPaymentDetectionType.NO_PAYMENT;
    }
  | {
      type: AccountCreationPaymentDetectionType.WRONG_ASSET;
      payment: AccountCreationDetectedPayment;
    }
  | {
      type: AccountCreationPaymentDetectionType.PAYMENT_FOUND;
      payment: AccountCreationDetectedPayment;
    };

export interface AccountCreationPaymentDetector {
  detectPayment: (
    request: HiveAccountCreationRequest,
  ) => Promise<AccountCreationPaymentDetectionResult>;
}

export const NoopAccountCreationPaymentDetector: AccountCreationPaymentDetector =
  {
    detectPayment: async () => ({
      type: AccountCreationPaymentDetectionType.NO_PAYMENT,
    }),
  };

interface HiveTransferHistoryItem {
  amount: string;
  currency: string;
  memo: string;
  to: string;
  txId: string;
  timestamp?: Date;
  blockNumber?: number;
}

const parseHiveAsset = (asset: unknown) => {
  const [amount, currency] = asset ? asset.toString().split(" ") : [];
  return { amount, currency };
};

const getOperation = (historyItem: any) => historyItem?.[1] ?? historyItem;

const getOperationPayload = (operation: any) => {
  const op = operation?.op;
  if (Array.isArray(op)) return { type: op[0], value: op[1] };
  return {
    type: op?.type?.replace("_operation", ""),
    value: op?.value,
  };
};

const mapTransferHistoryItem = (
  historyItem: any,
): HiveTransferHistoryItem | null => {
  const operation = getOperation(historyItem);
  const { type, value } = getOperationPayload(operation);
  if (type !== "transfer" || !value) return null;

  const { amount, currency } = parseHiveAsset(value.amount);
  if (!amount || !currency) return null;

  return {
    amount,
    currency,
    memo: value.memo ?? "",
    to: value.to,
    txId: operation.trx_id ?? "",
    timestamp: operation.timestamp ? new Date(`${operation.timestamp}Z`) : undefined,
    blockNumber: operation.block,
  };
};

const isTransferConfirmed = async (blockNumber?: number) => {
  if (!blockNumber) return false;

  const properties =
    await HiveUtils.getClient().database.getDynamicGlobalProperties();
  const irreversibleBlock = Number(properties.last_irreversible_block_num);
  const requiredConfirmations =
    Config.accountCreation.paymentDetection.requiredConfirmations;

  return irreversibleBlock - blockNumber + 1 >= requiredConfirmations;
};

const getPaymentAccountHistory = async (account: string) => {
  const historyLimit = Config.accountCreation.paymentDetection.historyLimit;
  return HiveUtils.getClient().database.getAccountHistory(
    account,
    -1,
    historyLimit,
  );
};

const findMatchingTransfer = async (request: HiveAccountCreationRequest) => {
  const paymentAccount =
    request.paymentAddress ?? Config.accountCreation.paymentAccount;
  const history = await getPaymentAccountHistory(paymentAccount);

  return history
    .map(mapTransferHistoryItem)
    .filter((transfer): transfer is HiveTransferHistoryItem => Boolean(transfer))
    .find(
      (transfer) =>
        transfer.to === paymentAccount && transfer.memo === request.paymentMemo,
    );
};

const isEvmPaymentRequest = (request: HiveAccountCreationRequest) =>
  request.paymentCurrency.startsWith("EVM:");

const detectEvmPayment = async (
  request: HiveAccountCreationRequest,
): Promise<AccountCreationPaymentDetectionResult> => {
  const result = await AccountCreationEvmPaymentDetectorLogic.detectPayment(
    request,
  );

  switch (result.type) {
    case AccountCreationEvmPaymentDetectionType.NO_PAYMENT:
      return { type: AccountCreationPaymentDetectionType.NO_PAYMENT };
    case AccountCreationEvmPaymentDetectionType.WRONG_ASSET:
      return {
        type: AccountCreationPaymentDetectionType.WRONG_ASSET,
        payment: result.payment,
      };
    case AccountCreationEvmPaymentDetectionType.PAYMENT_FOUND:
      return {
        type: AccountCreationPaymentDetectionType.PAYMENT_FOUND,
        payment: result.payment,
      };
  }
};

export const HiveAccountCreationPaymentDetector: AccountCreationPaymentDetector =
  {
    detectPayment: async (request) => {
      if (isEvmPaymentRequest(request)) {
        return detectEvmPayment(request);
      }

      if (
        request.paymentCurrency !==
        Config.accountCreation.paymentDetection.mvpCurrency
      ) {
        return { type: AccountCreationPaymentDetectionType.NO_PAYMENT };
      }

      const transfer = await findMatchingTransfer(request);
      if (!transfer) {
        return { type: AccountCreationPaymentDetectionType.NO_PAYMENT };
      }

      const detectedPayment: AccountCreationDetectedPayment = {
        amount: transfer.amount,
        currency: transfer.currency,
        txId: transfer.txId,
        confirmed: await isTransferConfirmed(transfer.blockNumber),
        detectedAt: transfer.timestamp ?? new Date(),
        blockNumber: transfer.blockNumber,
      };

      return {
        type:
          transfer.currency === request.paymentCurrency
            ? AccountCreationPaymentDetectionType.PAYMENT_FOUND
            : AccountCreationPaymentDetectionType.WRONG_ASSET,
        payment: detectedPayment,
      };
    },
  };
