"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiveAccountCreationPaymentDetector = exports.NoopAccountCreationPaymentDetector = exports.AccountCreationPaymentDetectionType = void 0;
const account_creation_evm_payment_detector_logic_1 = require("./account-creation-evm-payment-detector.logic");
var AccountCreationPaymentDetectionType;
(function (AccountCreationPaymentDetectionType) {
    AccountCreationPaymentDetectionType["NO_PAYMENT"] = "no_payment";
    AccountCreationPaymentDetectionType["PAYMENT_FOUND"] = "payment_found";
    AccountCreationPaymentDetectionType["WRONG_ASSET"] = "wrong_asset";
})(AccountCreationPaymentDetectionType || (exports.AccountCreationPaymentDetectionType = AccountCreationPaymentDetectionType = {}));
exports.NoopAccountCreationPaymentDetector = {
    detectPayment: async () => ({
        type: AccountCreationPaymentDetectionType.NO_PAYMENT,
    }),
};
const isEvmPaymentRequest = (request) => request.paymentCurrency.startsWith("EVM:");
const detectEvmPayment = async (request) => {
    const result = await account_creation_evm_payment_detector_logic_1.AccountCreationEvmPaymentDetectorLogic.detectPayment(request);
    switch (result.type) {
        case account_creation_evm_payment_detector_logic_1.AccountCreationEvmPaymentDetectionType.NO_PAYMENT:
            return { type: AccountCreationPaymentDetectionType.NO_PAYMENT };
        case account_creation_evm_payment_detector_logic_1.AccountCreationEvmPaymentDetectionType.WRONG_ASSET:
            return {
                type: AccountCreationPaymentDetectionType.WRONG_ASSET,
                payment: result.payment,
            };
        case account_creation_evm_payment_detector_logic_1.AccountCreationEvmPaymentDetectionType.PAYMENT_FOUND:
            return {
                type: AccountCreationPaymentDetectionType.PAYMENT_FOUND,
                payment: result.payment,
            };
    }
};
exports.HiveAccountCreationPaymentDetector = {
    detectPayment: async (request) => {
        if (!isEvmPaymentRequest(request)) {
            return { type: AccountCreationPaymentDetectionType.NO_PAYMENT };
        }
        return detectEvmPayment(request);
    },
};
//# sourceMappingURL=account-creation-payment-detector.js.map