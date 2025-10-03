import {
  ExchangeableToken,
  ExchangeEstimation,
  ExchangeMinMaxAmount,
  ExchangeOperationForm,
  SwapCryptos,
  SwapCryptosBaseProviderInterface,
  SwapCryptosExchangeResult,
} from "hive-keychain-commons";

export class SwapCryptosMerger {
  providers: SwapCryptosBaseProviderInterface[];
  currencyOptionsList: ExchangeableToken[] = [];
  constructor(providers: SwapCryptosBaseProviderInterface[]) {
    this.providers = providers;
  }
  getCurrencyOptions = () => {
    return this.currencyOptionsList;
  };
  fetchCurrencyOptions = async (symbol: string) => {
    let providersCurrencyOptionsList: ExchangeableToken[] = [];
    for (const provider of this.providers) {
      try {
        const currencyOptionList =
          await provider.getPairedCurrencyOptionItemList(symbol);

        for (const currencyOption of currencyOptionList) {
          const i = providersCurrencyOptionsList.findIndex(
            (e) =>
              e.symbol === currencyOption.symbol &&
              e.displayedNetwork === currencyOption.displayedNetwork
          );
          if (i >= 0) {
            const exchanges: SwapCryptos[] =
              providersCurrencyOptionsList[i].exchanges;
            exchanges.push(currencyOption.exchanges[0]);
            providersCurrencyOptionsList[i] = {
              ...providersCurrencyOptionsList[i],
              exchanges: exchanges,
            };
          } else {
            // Check if there's already an entry with the same symbol but different network
            const existingSameSymbol = providersCurrencyOptionsList.find(
              (e) => e.symbol === currencyOption.symbol
            );

            if (existingSameSymbol) {
              providersCurrencyOptionsList.push({
                ...currencyOption,
                name: existingSameSymbol.name,
              });
            } else {
              providersCurrencyOptionsList.push(currencyOption);
            }
          }
        }
      } catch (error) {
        console.log("Error getting exchange currencies", { provider, error });
      }
    }
    this.currencyOptionsList = providersCurrencyOptionsList.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    // put all symbols from the following list to the beginning of the array : btc,eth,usdt,usdc,dai,matic,solana,bnb,xrp,ada,dot,avax,doge,luna,ton regardless of the network or name and in this same order
    const symbolsToPutAtTheBeginning = [
      "btc",
      "eth",
      "usdt",
      "usdc",
      "dai",
      "matic",
      "solana",
      "bnb",
      "xrp",
      "ada",
      "dot",
      "avax",
      "doge",
      "luna",
      "ton",
    ];
    this.currencyOptionsList = this.currencyOptionsList.sort((a, b) => {
      const aIndex = symbolsToPutAtTheBeginning.indexOf(a.symbol);
      const bIndex = symbolsToPutAtTheBeginning.indexOf(b.symbol);

      if (aIndex !== -1 && bIndex !== -1) {
        // Both are in the list, sort by their order in the array
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        // a is in the list, b is not
        return -1;
      } else if (bIndex !== -1) {
        // b is in the list, a is not
        return 1;
      } else {
        // Neither is in the list, sort alphabetically by name
        return a.name.localeCompare(b.name);
      }
    });

    return this.currencyOptionsList;
  };
  getMinMaxAccepted = async (
    startToken,
    startNetwork,
    endToken,
    endNetwork
  ): Promise<ExchangeMinMaxAmount[]> => {
    let providerMinMaxAmountList: ExchangeMinMaxAmount[] = [];
    for (const provider of this.providers) {
      try {
        const minMaxAccepted = await provider.getMinMaxAmountAccepted(
          startToken,
          startNetwork,
          endToken,
          endNetwork
        );
        if (!minMaxAccepted) continue;
        providerMinMaxAmountList.push({
          provider: provider.name as SwapCryptos,
          min:
            minMaxAccepted[0] === null
              ? Infinity
              : parseFloat(minMaxAccepted[0]),
          max:
            minMaxAccepted[1] === null
              ? Infinity
              : parseFloat(minMaxAccepted[1]),
        });
      } catch (error) {
        console.log("No min/max available in Exchange", { provider, error });
      }
    }
    return providerMinMaxAmountList;
  };

  getExchangeEstimation = async (
    amount: string,
    from: string,
    fromNetwork: string,
    to: string,
    toNetwork: string
  ): Promise<ExchangeEstimation[] | undefined> => {
    let providerEstimationList: ExchangeEstimation[] = [];
    for (const provider of this.providers) {
      try {
        const estimation = await provider.getExchangeEstimation(
          amount,
          from,
          fromNetwork,
          to,
          toNetwork
        );

        if (!estimation || Number.isNaN(estimation.estimation)) continue;
        providerEstimationList.push({
          provider: provider.name as SwapCryptos,
          estimation: estimation,
        });
      } catch (error) {
        console.log("No estimation available in Exchange", { provider, error });
      }
    }
    return providerEstimationList.length
      ? providerEstimationList.sort(
          (a, b) => b.estimation.estimation - a.estimation.estimation
        )
      : undefined;
  };
  getNewExchange = async (
    formData: ExchangeOperationForm,
    providerName: SwapCryptos
  ): Promise<SwapCryptosExchangeResult | undefined> => {
    let result: SwapCryptosExchangeResult | undefined = undefined;
    try {
      result = await this.providers
        .find((p) => p.name === providerName)
        ?.getNewExchange(formData);
    } catch (error) {
      console.log("Error getting new exchange.", { providerName, error });
    } finally {
      return result;
    }
  };
}
