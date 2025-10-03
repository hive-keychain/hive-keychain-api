import {
  ExchangeableToken,
  ExchangeOperationForm,
  GenericObjectKeypair,
  SwapCryptos,
  SwapCryptosBaseProvider,
  SwapCryptosBaseProviderInterface,
  SwapCryptosEstimationDisplay,
  SwapCryptosExchangeResult,
} from "hive-keychain-commons";
import fetch from "node-fetch";
import { Config } from "../../config";

export class SimpleSwapProvider
  extends SwapCryptosBaseProvider
  implements SwapCryptosBaseProviderInterface
{
  constructor() {
    super(Config.swapCryptos.simpleswap);
    this.name = SwapCryptos.SIMPLESWAP;
    this.logo = "SWAP_CRYPTOS_SIMPLESWAP";
  }
  logoName: string;
  pairedCurrencyOptionsList: ExchangeableToken[] = [];
  name: string;
  logo: string;
  buildUrl = (route: string) => {
    const baseUrl = this.urls.baseUrl;
    return `${baseUrl}${route}`;
  };
  getPairedCurrencyOptionItemList = async (symbol: string) => {
    let pairedCurrencyOptionsList: ExchangeableToken[] = [];
    const currenciesRoute = `${this.urls.routes.allCurrencies}?api_key=${this.apiKey}`;
    const pairedCurrencyRoute = `${this.urls.routes.currencyPair}?api_key=${this.apiKey}&fixed=false&symbol=${symbol}`;
    const [allCurrencies, pairedCurrencyList] = await Promise.all(
      (
        await Promise.all([
          fetch(this.buildUrl(currenciesRoute)),
          fetch(this.buildUrl(pairedCurrencyRoute)),
        ])
      ).map((e) => e.json())
    );
    allCurrencies.result.map((currency: any) => {
      if (pairedCurrencyList.includes(currency.ticker)) {
        pairedCurrencyOptionsList.push({
          name: currency.name.split(" ")[0],
          symbol: currency.ticker,
          icon: currency.image,
          network: currency.network,
          displayedNetwork: currency.network,
          precision: currency.precision,
          legacySymbol: currency.legacySymbol,
          exchanges: [SwapCryptos.SIMPLESWAP],
        });
      }
    });
    this.pairedCurrencyOptionsList = pairedCurrencyOptionsList;
    return pairedCurrencyOptionsList;
  };

  getTickersAndNetworks = (
    from: string,
    fromNetwork: string,
    to: string,
    toNetwork: string
  ) => {
    const fromHive = from.toLowerCase() === "hive";

    const otherCurrency = this.pairedCurrencyOptionsList.find(
      (c) =>
        c.symbol === (fromHive ? to : from) &&
        c.network === (fromHive ? toNetwork : fromNetwork)
    );
    if (!otherCurrency) return;
    return {
      tickerFrom: fromHive ? "hive" : otherCurrency?.symbol,
      networkFrom: fromHive ? "hive" : otherCurrency?.network,
      tickerTo: !fromHive ? "hive" : otherCurrency?.symbol,
      networkTo: !fromHive ? "hive" : otherCurrency?.network,
    };
  };
  getMinMaxAmountAccepted = async (
    from: string,
    fromNetwork: string,
    to: string,
    toNetwork: string
  ) => {
    if (from === "HIVE") return;
    const minMaxAcceptedRoute = this.urls.routes.minMaxAccepted;
    if (minMaxAcceptedRoute.trim().length === 0) return [];
    const minMaxRoute = `${this.urls.routes.minMaxAccepted}`;
    const tickersAndNetworks = this.getTickersAndNetworks(
      from,
      fromNetwork,
      to,
      toNetwork
    );

    if (!tickersAndNetworks) return;
    const params = new URLSearchParams();
    params.append("api_key", this.apiKey);
    params.append("fixed", "false");
    params.append("tickerFrom", tickersAndNetworks.tickerFrom);
    params.append("networkFrom", tickersAndNetworks.networkFrom);
    params.append("tickerTo", tickersAndNetworks.tickerTo);
    params.append("networkTo", tickersAndNetworks.networkTo);

    const response = await (
      await fetch(this.buildUrl(minMaxRoute) + `?${params.toString()}`)
    ).json();
    return [response.result.min, response.result.max];
  };
  /**
   * Note: For simpleswap fee is set in the website, specifically: https://partners.simpleswap.io/webtools/api
   */
  getExchangeEstimation = async (
    amount: string,
    from: string,
    fromNetwork: string,
    to: string,
    toNetwork: string
  ) => {
    if (from === "HIVE") return;
    const tickersAndNetworks = this.getTickersAndNetworks(
      from,
      fromNetwork,
      to,
      toNetwork
    );
    if (!tickersAndNetworks) return;
    const link = `${this.urls.referalBaseUrl}${
      this.refId
    }&from=${from.toLowerCase()}-${
      tickersAndNetworks.networkFrom
    }&to=${to.toLowerCase()}-${tickersAndNetworks.networkTo}&amount=${amount}`;
    const estimation = await (
      await fetch(
        `https://simpleswap.io/api/v4/estimates?${new URLSearchParams({
          api_key: this.apiKey,
          fixed: false,
          ...tickersAndNetworks,
          amount,
          reverse: false,
        } as any).toString()}`
      )
    ).json();
    if (+amount > +estimation.result.max) return;
    return {
      swapCrypto: SwapCryptos.SIMPLESWAP,
      link: link,
      logoName: "SWAP_CRYPTOS_SIMPLESWAP",
      name: SwapCryptos.SIMPLESWAP,
      from: from,
      to: to,
      amount: parseFloat(amount),
      estimation: parseFloat(estimation.result.estimate),
    } as SwapCryptosEstimationDisplay;
  };
  getNewExchange = async (formData: ExchangeOperationForm) => {
    const data: GenericObjectKeypair = {
      fixed: formData.fixed,
      currency_from: formData.currencyFrom,
      currency_to: formData.currencyTo,
      amount: parseFloat(formData.amountFrom),
      address_to: formData.addressTo,
      extra_id_to: "",
      user_refund_address:
        formData.refundAddress.trim().length > 0 ? formData.refundAddress : "",
      user_refund_extra_id: "",
    };
    const requestConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const exchangeRoute = this.urls.routes.exchange;
    const finalUrl = this.buildUrl(exchangeRoute) + `?api_key=${this.apiKey}`;
    const exchangeResult = await (
      await fetch(finalUrl, data, requestConfig)
    ).json();
    return {
      id: exchangeResult.data.id,
      link: this.urls.fullLinkToExchange + exchangeResult.data.id,
    } as SwapCryptosExchangeResult;
  };
}
