"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleSwapProvider = void 0;
const hive_keychain_commons_1 = require("hive-keychain-commons");
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = require("../../config");
class SimpleSwapProvider extends hive_keychain_commons_1.SwapCryptosBaseProvider {
    constructor() {
        super(config_1.Config.swapCryptos.simpleswap);
        this.name = hive_keychain_commons_1.SwapCryptos.SIMPLESWAP;
        this.logo = "SWAP_CRYPTOS_SIMPLESWAP";
    }
    logoName;
    pairedCurrencyOptionsList = [];
    name;
    logo;
    buildUrl = (route) => {
        const baseUrl = this.urls.baseUrl;
        return `${baseUrl}${route}`;
    };
    getPairedCurrencyOptionItemList = async (symbol) => {
        let pairedCurrencyOptionsList = [];
        const currenciesRoute = `${this.urls.routes.allCurrencies}?api_key=${this.apiKey}`;
        const pairedCurrencyRoute = `${this.urls.routes.currencyPair}?api_key=${this.apiKey}&fixed=false&symbol=${symbol}`;
        const [allCurrencies, pairedCurrencyList] = await Promise.all((await Promise.all([
            (0, node_fetch_1.default)(this.buildUrl(currenciesRoute)),
            (0, node_fetch_1.default)(this.buildUrl(pairedCurrencyRoute)),
        ])).map((e) => e.json()));
        allCurrencies.result.map((currency) => {
            if (pairedCurrencyList.includes(currency.ticker)) {
                pairedCurrencyOptionsList.push({
                    name: currency.name.split(" ")[0],
                    symbol: currency.ticker,
                    icon: currency.image,
                    network: currency.network,
                    displayedNetwork: currency.network,
                    precision: currency.precision,
                    legacySymbol: currency.legacySymbol,
                    exchanges: [hive_keychain_commons_1.SwapCryptos.SIMPLESWAP],
                });
            }
        });
        this.pairedCurrencyOptionsList = pairedCurrencyOptionsList;
        return pairedCurrencyOptionsList;
    };
    getTickersAndNetworks = (from, fromNetwork, to, toNetwork) => {
        const fromHive = from.toLowerCase() === "hive";
        const otherCurrency = this.pairedCurrencyOptionsList.find((c) => c.symbol === (fromHive ? to : from) &&
            c.network === (fromHive ? toNetwork : fromNetwork));
        if (!otherCurrency)
            return;
        return {
            tickerFrom: fromHive ? "hive" : otherCurrency?.symbol,
            networkFrom: fromHive ? "hive" : otherCurrency?.network,
            tickerTo: !fromHive ? "hive" : otherCurrency?.symbol,
            networkTo: !fromHive ? "hive" : otherCurrency?.network,
        };
    };
    getMinMaxAmountAccepted = async (from, fromNetwork, to, toNetwork) => {
        if (from === "HIVE")
            return;
        const minMaxAcceptedRoute = this.urls.routes.minMaxAccepted;
        if (minMaxAcceptedRoute.trim().length === 0)
            return [];
        const minMaxRoute = `${this.urls.routes.minMaxAccepted}`;
        const tickersAndNetworks = this.getTickersAndNetworks(from, fromNetwork, to, toNetwork);
        if (!tickersAndNetworks)
            return;
        const params = new URLSearchParams();
        params.append("api_key", this.apiKey);
        params.append("fixed", "false");
        params.append("tickerFrom", tickersAndNetworks.tickerFrom);
        params.append("networkFrom", tickersAndNetworks.networkFrom);
        params.append("tickerTo", tickersAndNetworks.tickerTo);
        params.append("networkTo", tickersAndNetworks.networkTo);
        const response = await (await (0, node_fetch_1.default)(this.buildUrl(minMaxRoute) + `?${params.toString()}`)).json();
        if (!response.result)
            return;
        return [response.result.min, response.result.max];
    };
    /**
     * Note: For simpleswap fee is set in the website, specifically: https://partners.simpleswap.io/webtools/api
     */
    getExchangeEstimation = async (amount, from, fromNetwork, to, toNetwork) => {
        if (from === "HIVE")
            return;
        const tickersAndNetworks = this.getTickersAndNetworks(from, fromNetwork, to, toNetwork);
        if (!tickersAndNetworks)
            return;
        const link = `${this.urls.referalBaseUrl}${this.refId}&from=${from.toLowerCase()}-${tickersAndNetworks.networkFrom}&to=${to.toLowerCase()}-${tickersAndNetworks.networkTo}&amount=${amount}`;
        const estimation = await (await (0, node_fetch_1.default)(`https://simpleswap.io/api/v4/estimates?${new URLSearchParams({
            api_key: this.apiKey,
            fixed: false,
            ...tickersAndNetworks,
            amount,
            reverse: false,
        }).toString()}`)).json();
        if (!estimation.result || +amount > +estimation.result.max)
            return;
        return {
            swapCrypto: hive_keychain_commons_1.SwapCryptos.SIMPLESWAP,
            link: link,
            logoName: "SWAP_CRYPTOS_SIMPLESWAP",
            name: hive_keychain_commons_1.SwapCryptos.SIMPLESWAP,
            from: from,
            to: to,
            amount: parseFloat(amount),
            estimation: parseFloat(estimation.result.estimate),
        };
    };
    getNewExchange = async (formData) => {
        const data = {
            fixed: formData.fixed,
            currency_from: formData.currencyFrom,
            currency_to: formData.currencyTo,
            amount: parseFloat(formData.amountFrom),
            address_to: formData.addressTo,
            extra_id_to: "",
            user_refund_address: formData.refundAddress.trim().length > 0 ? formData.refundAddress : "",
            user_refund_extra_id: "",
        };
        const requestConfig = {
            headers: {
                "Content-Type": "application/json",
            },
        };
        const exchangeRoute = this.urls.routes.exchange;
        const finalUrl = this.buildUrl(exchangeRoute) + `?api_key=${this.apiKey}`;
        const exchangeResult = await (await (0, node_fetch_1.default)(finalUrl, data, requestConfig)).json();
        return {
            id: exchangeResult.data.id,
            link: this.urls.fullLinkToExchange + exchangeResult.data.id,
        };
    };
}
exports.SimpleSwapProvider = SimpleSwapProvider;
//# sourceMappingURL=simpleswap.provider.js.map