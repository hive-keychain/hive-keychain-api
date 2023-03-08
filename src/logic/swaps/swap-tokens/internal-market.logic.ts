import { HiveEngineUtils } from "../../../utils/hive-engine.utils";

export interface Book {
  _id: number;
  txId: string;
  timestamp: number;
  account: string;
  symbol: string;
  quantity: number;
  price: number;
  priceDec: any;
  expiration: number;
}

const getSellBookForToken = async (
  token: string,
  offset: number = 0
): Promise<any[]> => {
  const sellBook: any[] = await HiveEngineUtils.get({
    table: "sellBook",
    contract: "market",
    limit: 1000,
    indexes: [
      {
        index: "priceDec",
        descending: false,
      },
    ],
    offset: offset,
    query: { symbol: token },
  });

  return sellBook.map((s) => {
    return {
      ...s,
      quantity: parseFloat(s.quantity),
      price: parseFloat(s.price),
    };
  });
};

const getBuyBookForToken = async (
  token: string,
  offset: number = 0
): Promise<Book[]> => {
  const buyBook: any[] = await HiveEngineUtils.get({
    table: "buyBook",
    contract: "market",
    limit: 1000,
    indexes: [
      {
        index: "priceDec",
        descending: true,
      },
    ],
    offset: offset,
    query: { symbol: token },
  });
  return buyBook.map((b) => {
    return {
      ...b,
      quantity: parseFloat(b.quantity),
      price: parseFloat(b.price),
    };
  });
};

export const InternalMarketLogic = {
  getBuyBookForToken,
  getSellBookForToken,
};
