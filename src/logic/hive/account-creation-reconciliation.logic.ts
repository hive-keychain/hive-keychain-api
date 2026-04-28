import {
  AccountCreationDetectedPayment,
  AccountCreationPaymentDetectionResult,
  AccountCreationPaymentDetectionType,
  AccountCreationPaymentDetector,
  NoopAccountCreationPaymentDetector,
} from "./account-creation-payment-detector";
import { HiveAccountCreationRequestLogic } from "./account-creation-request.logic";
import {
  HiveAccountCreationRequest,
  HiveAccountCreationStatus,
} from "./account-creation-request.model";

export enum AccountCreationPaymentClassification {
  NO_PAYMENT = "no_payment",
  FULL_PAYMENT = "full_payment",
  PAYMENT_CONFIRMING = "payment_confirming",
  UNDERPAYMENT = "underpayment",
  OVERPAYMENT = "overpayment",
  PAYMENT_AFTER_EXPIRY = "payment_after_expiry",
  WRONG_ASSET = "wrong_asset",
}

export interface AccountCreationPaymentReconciliationResult {
  requestId: string;
  classification: AccountCreationPaymentClassification;
  status: HiveAccountCreationStatus;
  updated: boolean;
}

const compareAmounts = (actual: string, expected: string) => {
  const actualAmount = Number(actual);
  const expectedAmount = Number(expected);
  if (!Number.isFinite(actualAmount) || !Number.isFinite(expectedAmount)) {
    throw new Error("Invalid payment amount.");
  }
  if (actualAmount === expectedAmount) return 0;
  return actualAmount > expectedAmount ? 1 : -1;
};

const isAfterExpiry = (
  request: HiveAccountCreationRequest,
  payment: AccountCreationDetectedPayment,
) => payment.detectedAt.getTime() > request.expiresAt.getTime();

const classifyPayment = (
  request: HiveAccountCreationRequest,
  result: AccountCreationPaymentDetectionResult,
): {
  classification: AccountCreationPaymentClassification;
  status: HiveAccountCreationStatus;
  payment?: AccountCreationDetectedPayment;
} => {
  if (result.type === AccountCreationPaymentDetectionType.NO_PAYMENT) {
    return {
      classification: AccountCreationPaymentClassification.NO_PAYMENT,
      status: request.status,
    };
  }

  if (result.type === AccountCreationPaymentDetectionType.WRONG_ASSET) {
    return {
      classification: AccountCreationPaymentClassification.WRONG_ASSET,
      status: request.status,
      payment: result.payment,
    };
  }

  const { payment } = result;
  if (payment.currency !== request.paymentCurrency) {
    return {
      classification: AccountCreationPaymentClassification.WRONG_ASSET,
      status: request.status,
      payment,
    };
  }

  if (isAfterExpiry(request, payment)) {
    return {
      classification: AccountCreationPaymentClassification.PAYMENT_AFTER_EXPIRY,
      status: HiveAccountCreationStatus.PAID_AFTER_EXPIRY,
      payment,
    };
  }

  const amountComparison = compareAmounts(payment.amount, request.expectedAmount);
  if (amountComparison < 0) {
    return {
      classification: AccountCreationPaymentClassification.UNDERPAYMENT,
      status: HiveAccountCreationStatus.UNDERPAID,
      payment,
    };
  }
  if (amountComparison > 0) {
    return {
      classification: AccountCreationPaymentClassification.OVERPAYMENT,
      status: HiveAccountCreationStatus.OVERPAID,
      payment,
    };
  }

  if (!payment.confirmed) {
    return {
      classification: AccountCreationPaymentClassification.PAYMENT_CONFIRMING,
      status: HiveAccountCreationStatus.PAYMENT_CONFIRMING,
      payment,
    };
  }

  return {
    classification: AccountCreationPaymentClassification.FULL_PAYMENT,
    status: HiveAccountCreationStatus.PAYMENT_DETECTED,
    payment,
  };
};

const reconcileRequestPayment = async (
  request: HiveAccountCreationRequest,
  detector: AccountCreationPaymentDetector = NoopAccountCreationPaymentDetector,
): Promise<AccountCreationPaymentReconciliationResult> => {
  const detectionResult = await detector.detectPayment(request);
  const classification = classifyPayment(request, detectionResult);
  const shouldUpdate =
    classification.payment !== undefined &&
    classification.status !== request.status &&
    classification.classification !== AccountCreationPaymentClassification.WRONG_ASSET;

  if (!shouldUpdate) {
    return {
      requestId: request.requestId,
      classification: classification.classification,
      status: request.status,
      updated: false,
    };
  }

  const updatedRequest = await HiveAccountCreationRequestLogic.updateStatus(
    request.requestId,
    classification.status,
    {
      paidAmount: classification.payment!.amount,
      paymentTxId: classification.payment!.txId,
    },
  );

  return {
    requestId: request.requestId,
    classification: classification.classification,
    status: updatedRequest?.status ?? request.status,
    updated: updatedRequest !== null,
  };
};

const reconcilePendingPayments = async (
  detector: AccountCreationPaymentDetector = NoopAccountCreationPaymentDetector,
) => {
  const requests =
    await HiveAccountCreationRequestLogic.getPaymentReconciliationCandidates();
  return Promise.all(
    requests.map((request) => reconcileRequestPayment(request, detector)),
  );
};

export const HiveAccountCreationReconciliationLogic = {
  classifyPayment,
  reconcileRequestPayment,
  reconcilePendingPayments,
};
