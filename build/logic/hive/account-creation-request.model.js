"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveAccountCreationStatus = void 0;
var HiveAccountCreationStatus;
(function (HiveAccountCreationStatus) {
    HiveAccountCreationStatus["PAYMENT_PENDING"] = "payment_pending";
    HiveAccountCreationStatus["PAYMENT_DETECTED"] = "payment_detected";
    HiveAccountCreationStatus["PAYMENT_CONFIRMING"] = "payment_confirming";
    HiveAccountCreationStatus["CREATING_ACCOUNT"] = "creating_account";
    HiveAccountCreationStatus["ACCOUNT_CREATED"] = "account_created";
    HiveAccountCreationStatus["EXPIRED"] = "expired";
    HiveAccountCreationStatus["UNDERPAID"] = "underpaid";
    HiveAccountCreationStatus["OVERPAID"] = "overpaid";
    HiveAccountCreationStatus["PAID_AFTER_EXPIRY"] = "paid_after_expiry";
    HiveAccountCreationStatus["USERNAME_UNAVAILABLE"] = "username_unavailable";
    HiveAccountCreationStatus["ACCOUNT_CREATION_FAILED"] = "account_creation_failed";
    HiveAccountCreationStatus["CANCELLED"] = "cancelled";
})(HiveAccountCreationStatus || (exports.HiveAccountCreationStatus = HiveAccountCreationStatus = {}));
//# sourceMappingURL=account-creation-request.model.js.map