import { LiquidityPool } from "../../interfaces/tokens.interface";
import { HiveEngineUtils } from "../../utils/hive-engine.utils";

const getTokenMarketPool = async () => {
  let pool = [];
  let offset = 0;

  let res = [];
  do {
    res = await HiveEngineUtils.get({
      contract: "marketpools",
      table: "pools",
      query: {},
      limit: 1000,
      offset: offset,
      indexes: [],
    });
    //  (
    //   `offset => ${offset} / pool size => ${pool.length} / res => ${res.length}`
    // );
    offset += 1000;
    pool = [...pool, ...res];
  } while (res.length === 1000);
  return pool.map((l) => {
    return {
      _id: l._id,
      tokenPair: l.tokenPair,
      baseQuantity: Number(l.baseQuantity),
      baseVolume: Number(l.baseVolume),
      basePrice: Number(l.basePrice),
      quoteQuantity: Number(l.quoteQuantity),
      quoteVolume: Number(l.quoteVolume),
      quotePrice: Number(l.quotePrice),
      totalShares: Number(l.totalShares),
      precision: l.precision,
      creator: l.creator,
    } as LiquidityPool;
  });
};

export const LiquidityPoolLogic = {
  getTokenMarketPool,
};
