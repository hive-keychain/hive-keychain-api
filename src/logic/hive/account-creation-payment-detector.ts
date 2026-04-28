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
