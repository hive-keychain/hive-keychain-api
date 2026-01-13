"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapCryptoLogic = void 0;
const simpleswap_provider_1 = require("../utils/swap-crypto/simpleswap.provider");
const stealthex_provider_1 = require("../utils/swap-crypto/stealthex.provider");
const swap_cryptos_utils_1 = require("../utils/swap-crypto/swap-cryptos.utils");
const merger = new swap_cryptos_utils_1.SwapCryptosMerger([
    new simpleswap_provider_1.SimpleSwapProvider(),
    new stealthex_provider_1.StealthexProvider(),
]);
const fetchCurrencyOptions = async () => {
    try {
        const currencyOptions = await merger.fetchCurrencyOptions("HIVE");
        //     console.log(currencyOptions.length);
    }
    catch (error) {
        console.log(error);
    }
};
setInterval(fetchCurrencyOptions, 1000 * 3600);
fetchCurrencyOptions();
const getCurrencyOptions = () => {
    return merger.getCurrencyOptions();
};
const getRange = async (tokenFrom, networkFrom, tokenTo, networkTo) => {
    return merger.getMinMaxAccepted(tokenFrom, networkFrom, tokenTo, networkTo);
};
const getExchangeEstimation = async (amount, tokenFrom, networkFrom, tokenTo, networkTo) => {
    return merger.getExchangeEstimation(amount, tokenFrom, networkFrom, tokenTo, networkTo);
};
exports.SwapCryptoLogic = {
    getCurrencyOptions,
    getRange,
    getExchangeEstimation,
};
//# sourceMappingURL=swap-crypto.logic.js.map