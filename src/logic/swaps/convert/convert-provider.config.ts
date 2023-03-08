import { Provider } from "../../../interfaces/swap.interface";

const getConfig = (provider: Provider) => {
  return config.providers[provider];
};

export const ConvertProviderConfig = { getConfig };

const config: IConvertProviderConfig = {
  providers: {
    [Provider.LEODEX]: {
      name: Provider.LEODEX,
      fullName: "LeoDex",
      accountName: "leodex",
      withdrawal: {
        fee: 0.25,
        minimumFee: 0,
        balancedFreeFee: false,
      },
      deposit: {
        fee: 0.25,
        minimumFee: 0,
        balancedFreeFee: false,
      },
    },
    [Provider.BEESWAP]: {
      name: Provider.BEESWAP,
      fullName: "BeeSwap",
      accountName: "hiveswap",
      withdrawal: {
        fee: 0.25,
        minimumFee: 0,
        balancedFreeFee: true,
      },
      deposit: {
        fee: 0.25,
        minimumFee: 0,
        balancedFreeFee: true,
      },
    },
    [Provider.DISCOUNTED_BRIDGE]: {
      name: Provider.DISCOUNTED_BRIDGE,
      fullName: "Discounted Bridge",
      accountName: "uswap",
      withdrawal: {
        fee: 0.1,
        minimumFee: 0,
        balancedFreeFee: true,
      },
      deposit: {
        fee: 0.1,
        minimumFee: 0,
        balancedFreeFee: true,
      },
    },
    [Provider.HIVE_PAY]: {
      name: Provider.HIVE_PAY,
      fullName: "Hive Pay",
      accountName: "hivepayswap",
      withdrawal: {
        fee: 0.2,
        minimumFee: 0.001,
        balancedFreeFee: false,
      },
      deposit: {
        fee: 0.2,
        minimumFee: 0.001,
        balancedFreeFee: false,
      },
    },
    [Provider.HIVE_ENGINE]: {
      name: Provider.HIVE_ENGINE,
      fullName: "Hive Engine",
      accountName: "honey-swap",
      withdrawal: {
        fee: 0.75,
        minimumFee: 0.0,
        balancedFreeFee: false,
      },
      deposit: {
        fee: 0.75,
        minimumFee: 0.0,
        balancedFreeFee: false,
      },
    },
  },
};

type IProviderItem = { [p in Provider]?: IProvider };

interface IConvertProviderConfig {
  providers: IProviderItem;
}

interface IProvider {
  name: string;
  fullName: string;
  accountName: string;
  withdrawal: IConvertOptions;
  deposit: IConvertOptions;
}

interface IConvertOptions {
  fee: number;
  minimumFee: number;
  balancedFreeFee: boolean;
}
