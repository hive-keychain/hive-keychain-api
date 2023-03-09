import { Provider, SwapStepType } from "../../../interfaces/swap.interface";
import { HBD, HIVE } from "../../../interfaces/tokens.interface";
import { HiveUtils } from "../../../utils/hive.utils";

const getMarket = async () => {
  const orderBook = await HiveUtils.getClient().call(
    "condenser_api",
    "get_order_book"
  );
  return orderBook;
};

interface Order {
  orderPrice: OrderPrice;
  realPrice: number;
  hive: number;
  hbd: number;
}

interface OrderPrice {
  base: string;
  quote: string;
}

const getHiveToHBDBook = async (): Promise<Order[]> => {
  const orderBook = await getMarket();
  return orderBook.bids.map((bid) => {
    return {
      orderPrice: bid.order_price,
      realPrice: Number(bid.real_price),
      hive: bid.hive,
      hbd: bid.hbd,
    };
  });
};
const getHBDToHiveBook = async (): Promise<Order[]> => {
  const orderBook = await getMarket();
  return orderBook.asks.map((ask) => {
    return {
      orderPrice: ask.order_price,
      realPrice: Number(ask.real_price),
      hive: ask.hive,
      hbd: ask.hbd,
    };
  });
};

const estimateHiveToHbd = async (amount: number) => {
  const book = await getHiveToHBDBook();
  let hiveRemaining = amount;
  let totalHbd = 0;
  for (const order of book) {
    const totalNeededFromItem =
      order.hive > hiveRemaining ? hiveRemaining : order.hive;

    totalHbd += totalNeededFromItem * order.realPrice;
    hiveRemaining -= totalNeededFromItem;

    if (hiveRemaining === 0) {
      return {
        step: SwapStepType.SELL_ON_MARKET,
        provider: Provider.HIVE_INTERNAL_MARKET,
        startToken: HIVE,
        endToken: HBD,
        estimate: totalHbd,
      };
    }
  }
};
const estimateHbdToHive = async (amount: number) => {
  const book = await getHBDToHiveBook();

  let hbdRemaining = amount;
  let totalHive = 0;
  for (const order of book) {
    const totalNeededFromItem =
      order.hbd > hbdRemaining ? hbdRemaining : order.hbd;

    totalHive += totalNeededFromItem / order.realPrice;
    hbdRemaining -= totalNeededFromItem;

    if (hbdRemaining === 0) {
      return {
        step: SwapStepType.BUY_ON_MARKET,
        provider: Provider.HIVE_INTERNAL_MARKET,
        startToken: HBD,
        endToken: HIVE,
        estimate: totalHive,
      };
    }
  }
};

export const InternalMarketLogic = {
  estimateHbdToHive,
  estimateHiveToHbd,
};
