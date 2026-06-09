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
      if (!isEvmPaymentRequest(request)) {
        return { type: AccountCreationPaymentDetectionType.NO_PAYMENT };
      }

      return detectEvmPayment(request);
    },
  };
