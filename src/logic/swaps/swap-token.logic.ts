import Logger from "hive-keychain-commons/lib/logger/logger";
import { Config } from "../../config";
import { LiquidityPool } from "../../interfaces/tokens.interface";
import { HiveEngineUtils } from "../../utils/hive-engine.utils";
import { DSwapUtils } from "./dswap.utils";

let tokenMarketPool: LiquidityPool[] = [];

const estimateSwapValue = async (
  startToken: string,
  endToken: string,
  amount: number
) => {
  return {
    HELiquidityPool: estimateLiquidityValue(startToken, endToken, amount),
    DSwap: await DSwapUtils.calculateSwapOutput(startToken, endToken, amount),
  };
};

const SWAP_HIVE = "SWAP.HIVE";

const estimateLiquidityValue = (
  startToken: string,
  endToken: string,
  amount: number
) => {
  let liquidity = tokenMarketPool.find(
    (p) => p.tokenPair === `${startToken}:${endToken}`
  );
  let num: number;
  let den: number;
  if (!liquidity) {
    liquidity = tokenMarketPool.find(
      (p) => p.tokenPair === `${endToken}:${startToken}`
    );
    if (liquidity) {
      num = liquidity.baseQuantity * amount;
      den = liquidity.quoteQuantity + amount;
    } else if (startToken !== SWAP_HIVE && endToken !== SWAP_HIVE) {
      const nbSwapHive = estimateLiquidityValue(startToken, SWAP_HIVE, amount);
      return estimateLiquidityValue(SWAP_HIVE, endToken, nbSwapHive);
    }
  } else {
    num = liquidity.quoteQuantity * amount;
    den = liquidity.baseQuantity + amount;
  }

  const amountOut = num / den;
  return amountOut;
};

const refreshTokenMarketPool = async () => {
  Logger.info("Fetching market pool");
  try {
    tokenMarketPool = await SwapTokenLogic.getTokenMarketPool();
  } catch (err) {
    Logger.warn("Failed to fetch market pool");
  }
};

const initAutoRefreshTokenMarketPool = () => {
  refreshTokenMarketPool();
  setInterval(() => {
    refreshTokenMarketPool();
  }, Config.swaps.marketPool.autoRefreshIntervalInSec * 1000);
};

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
    // console.log(
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

const getMarketPools = () => {
  return tokenMarketPool;
};

export const SwapTokenLogic = {
  estimateSwapValue,
  getTokenMarketPool,
  refreshTokenMarketPool,
  initAutoRefreshTokenMarketPool,
  getMarketPools,
};
