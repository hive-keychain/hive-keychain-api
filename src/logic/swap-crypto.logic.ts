import { SimpleSwapProvider } from "../utils/swap-crypto/simpleswap.provider";
import { StealthexProvider } from "../utils/swap-crypto/stealthex.provider";
import { SwapCryptosMerger } from "../utils/swap-crypto/swap-cryptos.utils";

const merger = new SwapCryptosMerger([
  new SimpleSwapProvider(),
  new StealthexProvider(),
]);

const fetchCurrencyOptions = async () => {
  try {
    const currencyOptions = await merger.fetchCurrencyOptions("HIVE");
    //     console.log(currencyOptions.length);
  } catch (error) {
    console.log(error);
  }
};
setInterval(fetchCurrencyOptions, 1000 * 3600);
fetchCurrencyOptions();
const getCurrencyOptions = () => {
  return merger.getCurrencyOptions();
};
const getRange = async (
  tokenFrom: string,
  networkFrom: string,
  tokenTo: string,
  networkTo: string
) => {
  return merger.getMinMaxAccepted(tokenFrom, networkFrom, tokenTo, networkTo);
};

const getExchangeEstimation = async (
  amount: string,
  tokenFrom: string,
  networkFrom: string,
  tokenTo: string,
  networkTo: string
) => {
  return merger.getExchangeEstimation(
    amount,
    tokenFrom,
    networkFrom,
    tokenTo,
    networkTo
  );
};

export const SwapCryptoLogic = {
  getCurrencyOptions,
  getRange,
  getExchangeEstimation,
};
