export enum HiveAccountCreationStatus {
  PAYMENT_PENDING = "payment_pending",
  PAYMENT_DETECTED = "payment_detected",
  PAYMENT_CONFIRMING = "payment_confirming",
  CREATING_ACCOUNT = "creating_account",
  ACCOUNT_CREATED = "account_created",
  EXPIRED = "expired",
  UNDERPAID = "underpaid",
  OVERPAID = "overpaid",
  PAID_AFTER_EXPIRY = "paid_after_expiry",
  USERNAME_UNAVAILABLE = "username_unavailable",
  ACCOUNT_CREATION_FAILED = "account_creation_failed",
  CANCELLED = "cancelled",
}

export interface HiveAccountCreationRequest {
  requestId: string;
  username: string;
  ownerPublicKey: string;
  activePublicKey: string;
  postingPublicKey: string;
  memoPublicKey: string;
  paymentCurrency: string;
  paymentChainId?: string | null;
  paymentTokenAddress?: string | null;
  paymentPriceUsd?: string | null;
  paymentAddress?: string | null;
  paymentMemo?: string | null;
  payerEvmAddress?: string | null;
  expectedAmount: string;
  paidAmount?: string | null;
  paymentTxId?: string | null;
  accountCreationTxId?: string | null;
  status: HiveAccountCreationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NewHiveAccountCreationRequest = Omit<
  HiveAccountCreationRequest,
  "createdAt" | "updatedAt"
>;

export interface HiveAccountCreationRequestStatusUpdate {
  paidAmount?: string | null;
  paymentTxId?: string | null;
  accountCreationTxId?: string | null;
}
