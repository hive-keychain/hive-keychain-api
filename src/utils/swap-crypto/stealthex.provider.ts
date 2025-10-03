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

export class StealthexProvider
  extends SwapCryptosBaseProvider
  implements SwapCryptosBaseProviderInterface
{
  pairedCurrencyOptionsList: ExchangeableToken[] = [];
  constructor() {
    super(Config.swapCryptos.stealthex);
    this.name = SwapCryptos.STEALTHEX;
    this.logo = "SWAP_CRYPTOS_STEALTHEX";
  }
  logoName: string;
  name: string;
  logo: string;
  allCurrenciesData: any[] = [];
  buildUrl = (route: string) => {
    const baseUrl = this.urls.baseUrl;
    return `${baseUrl}${route}`;
  };
  getPairedCurrencyOptionItemList = async (symbol: string) => {
    let pairedCurrencyOptionsList: ExchangeableToken[] = [];
    let requestHeaders: GenericObjectKeypair = {};

    requestHeaders[`Authorization`] = `Bearer ${this.apiKey}`;

    const currenciesRoute = this.urls.routes.allCurrencies;
    const currencyPairRoute = this.urls.routes.currencyPair;

    // Fetch all currencies by iterating offset in batches of 4 (parallel)
    let allCurrenciesData: any[] = [];
    let offset = 0;
    let hasMore = true;
    const batchSize = 10;
    while (hasMore) {
      const requests: any[] = [];
      for (let i = 0; i < batchSize; i++) {
        const request = fetch(
          this.buildUrl(
            `${currenciesRoute}?limit=250&offset=${offset + i * 250}`
          ),
          {
            headers: requestHeaders,
          }
        );
        requests.push(request);
      }
      const responses = await Promise.all(
        (await Promise.all(requests)).map((e) => e.json())
      );
      let anyBatchLessThan250 = false;
      for (const response of responses) {
        const batch = response;
        allCurrenciesData = allCurrenciesData.concat(batch);
        if (!batch || batch.length < 250) {
          anyBatchLessThan250 = true;
        }
      }
      if (anyBatchLessThan250) {
        hasMore = false;
      } else {
        offset += batchSize * 250;
      }
    }
    const pairedCurrencyList = await (
      await fetch(
        this.buildUrl(
          `${currencyPairRoute}${symbol}/mainnet?include_available_routes=true`
        ),
        {
          headers: requestHeaders,
        }
      )
    ).json();
    pairedCurrencyList.available_routes.map((currency: any) => {
      const thisCurrency = allCurrenciesData.find(
        (c: any) =>
          c.symbol === currency.symbol && c.network === currency.network
      );

      if (!thisCurrency) return; // skip if not found
      pairedCurrencyOptionsList.push({
        displayedNetwork:
          currency.network === "mainnet" ? currency.symbol : currency.network,
        name: thisCurrency.name,
        symbol: thisCurrency.symbol,
        icon: thisCurrency.icon_url,
        network: thisCurrency.network,
        precision: thisCurrency.precision,
        exchanges: [SwapCryptos.STEALTHEX],
        legacySymbol: thisCurrency.legacy_symbol,
      });
    });
    this.allCurrenciesData = allCurrenciesData;
    this.pairedCurrencyOptionsList = pairedCurrencyOptionsList;
    return pairedCurrencyOptionsList;
  };

  getRouteParams = (
    from: string,
    fromNetwork: string,
    to: string,
    toNetwork: string,
    otherParams?: any
  ) => {
    const hiveObj = { symbol: "hive", network: "mainnet" };
    const isFromHive = from.toLowerCase() === hiveObj.symbol;
    const other = this.pairedCurrencyOptionsList.find(
      (c) =>
        c.symbol === (isFromHive ? to : from) &&
        c.displayedNetwork === (isFromHive ? toNetwork : fromNetwork)
    )!;
    const params = {
      route: isFromHive
        ? {
            from: hiveObj,
            to: { symbol: other.symbol, network: other.network },
          }
        : {
            from: { symbol: other.symbol, network: other.network },
            to: hiveObj,
          },
      estimation: "direct",
      rate: "floating",
      ...otherParams,
    };
    return params;
  };
  getMinMaxAmountAccepted = async (
    from: string,
    fromNetwork: string,
    to: string,
    toNetwork: string
  ) => {
    let requestHeaders: GenericObjectKeypair = {};
    requestHeaders[`Authorization`] = `Bearer ${this.apiKey}`;
    requestHeaders[`Content-Type`] = `application/json`;
    const minMaxAcceptedRoute = this.urls.routes.minMaxAccepted;
    if (minMaxAcceptedRoute.trim().length === 0) return [];
    const minMaxRoute = `${this.urls.routes.minMaxAccepted}`;

    const response = await (
      await fetch(this.buildUrl(minMaxRoute), {
        method: "post",
        headers: requestHeaders,
        body: JSON.stringify(
          this.getRouteParams(from, fromNetwork, to, toNetwork)
        ),
      })
    ).json();
    return [response.min_amount, response.max_amount];
  };

  getExchangeEstimation = async (
    amount: string,
    from: string,
    fromNetwork: string,
    to: string,
    toNetwork: string
  ) => {
    let requestHeaders: GenericObjectKeypair = {};
    requestHeaders[`Authorization`] = `Bearer ${this.apiKey}`;
    requestHeaders[`Content-Type`] = `application/json`;
    const requestData = {
      ...this.getRouteParams(from, fromNetwork, to, toNetwork, {
        amount: parseFloat(amount),
        additional_fee_percent:
          Config.swapCryptos.stealthex.partnerFeeAmount ?? 0,
      }),
    };
    const estimationRoute = `${this.urls.routes.estimation}`;
    const fromLegacySymbol =
      from.toLowerCase() === "hive"
        ? "hive"
        : this.allCurrenciesData.find(
            (c) =>
              c.symbol.toLowerCase() === from.toLowerCase() &&
              c.network === fromNetwork
          )?.legacy_symbol || from;
    const toLegacySymbol =
      to.toLowerCase() === "hive"
        ? "hive"
        : this.allCurrenciesData.find(
            (c) =>
              c.symbol.toLowerCase() === to.toLowerCase() &&
              c.network === toNetwork
          )?.legacy_symbol || to;
    const link = `${Config.swapCryptos.stealthex.urls.referalBaseUrl}${Config.swapCryptos.stealthex.refId}&amount=${amount}&from=${fromLegacySymbol}&to=${toLegacySymbol}`;
    //     const extensionId = (await chrome.management.getSelf()).id;
    //     const link = `chrome-extension://${extensionId}/exchange-cryptos.html?amount=${amount}&from=${from.toLowerCase()}&to=${to.toLowerCase()}&type=${
    //      SwapCryptos.STEALTHEX
    //    }`;
    const estimation = await (
      await fetch(this.buildUrl(estimationRoute), {
        body: JSON.stringify(requestData),
        method: "POST",
        headers: requestHeaders,
      })
    ).json();

    return {
      swapCrypto: SwapCryptos.STEALTHEX,
      link: link,
      logoName: "SWAP_CRYPTOS_STEALTHEX",
      name: SwapCryptos.STEALTHEX,
      from: from,
      to: to,
      amount: parseFloat(amount),
      estimation: estimation.estimated_amount,
    } as SwapCryptosEstimationDisplay;
  };
  getNewExchange = async (
    formData: ExchangeOperationForm
  ): Promise<SwapCryptosExchangeResult> => {
    let data: GenericObjectKeypair = {
      fixed: formData.fixed,
      currency_from: formData.currencyFrom,
      currency_to: formData.currencyTo,
      amount_from: parseFloat(formData.amountFrom),
      partner_fee: Config.swapCryptos.stealthex.partnerFeeAmount,
      address_to: formData.addressTo,
    };
    if (formData.refundAddress.trim().length > 0) {
      data["refund_address"] = formData.refundAddress;
    }
    const requestConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const exchangeRoute = this.urls.routes.exchange;
    const finalUrl = this.buildUrl(exchangeRoute) + `?api_key=${this.apiKey}`;
    const exchangeResult = await fetch(finalUrl, data, requestConfig);
    return {
      id: exchangeResult.data.id,
      link: this.urls.fullLinkToExchange + exchangeResult.data.id,
    } as SwapCryptosExchangeResult;
  };
}
