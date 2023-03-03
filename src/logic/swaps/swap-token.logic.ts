import Logger from "hive-keychain-commons/lib/logger/logger";
import { Config } from "../../config";
import { LiquidityPool } from "../../interfaces/tokens.interface";
import { Book, InternalMarketLogic } from "./internal-market.logic";
import { LiquidityPoolLogic } from "./liquidity-pool.logic";

const SWAP_HIVE = "SWAP.HIVE";
let liquidityPools: LiquidityPool[] = [];

const estimateSwapValue = async (
  startToken: string,
  endToken: string,
  amount: number
) => {
  const [pool, internalMarket] = await Promise.all([
    SwapTokenLogic.estimateLiquidityPoolValue(startToken, endToken, amount),
    await SwapTokenLogic.estimateValueFromInternalMarket(
      startToken,
      endToken,
      amount
    ),
  ]);

  return {
    HELiquidityPool: pool,
    internalMarket: internalMarket,
  };
};

const estimateLiquidityPoolValue = (
  startToken: string,
  endToken: string,
  amount: number
) => {
  let liquidity = liquidityPools.find(
    (p) => p.tokenPair === `${startToken}:${endToken}`
  );
  let num: number;
  let den: number;
  if (!liquidity) {
    liquidity = liquidityPools.find(
      (p) => p.tokenPair === `${endToken}:${startToken}`
    );
    if (liquidity) {
      num = liquidity.baseQuantity * amount;
      den = liquidity.quoteQuantity + amount;
    } else if (startToken !== SWAP_HIVE && endToken !== SWAP_HIVE) {
      const nbSwapHive = estimateLiquidityPoolValue(
        startToken,
        SWAP_HIVE,
        amount
      );
      return estimateLiquidityPoolValue(SWAP_HIVE, endToken, nbSwapHive);
    }
  } else {
    num = liquidity.quoteQuantity * amount;
    den = liquidity.baseQuantity + amount;
  }

  const amountOut = num / den;
  return amountOut;
};

const estimateValueFromInternalMarket = async (
  startToken: string,
  endToken: string,
  amount: number
) => {
  Logger.info(`Tring to convert ${amount} ${startToken} to ${endToken}`);

  let totalSwapHive = 0;
  let filteredMarketItems = [];
  let startTokenRemaining = amount;

  const sellMarket: Book[] = await InternalMarketLogic.getSellBookForToken(
    startToken
  );

  for (const marketItem of sellMarket) {
    const totalNeededFromItem =
      marketItem.quantity > startTokenRemaining
        ? startTokenRemaining
        : marketItem.quantity;

    totalSwapHive += totalNeededFromItem * marketItem.price;
    startTokenRemaining -= totalNeededFromItem;

    if (startTokenRemaining === 0) break;
  }

  if (startToken === SWAP_HIVE) totalSwapHive = amount;

  if (endToken === SWAP_HIVE) return totalSwapHive;

  const buyMarket: Book[] = await InternalMarketLogic.getBuyBookForToken(
    endToken
  );

  filteredMarketItems = [];
  let totalEndToken = 0;
  let totalSwapHiveRemaining = totalSwapHive;
  for (const marketItem of buyMarket) {
    const totalNeededFromItem =
      marketItem.quantity > totalSwapHiveRemaining
        ? totalSwapHiveRemaining
        : marketItem.quantity;

    totalEndToken += totalNeededFromItem / marketItem.price;
    totalSwapHiveRemaining -= totalNeededFromItem;

    if (totalSwapHiveRemaining === 0) return totalEndToken;
  }
};

const refreshTokenMarketPool = async () => {
  Logger.info("Fetching market pool");
  try {
    liquidityPools = await LiquidityPoolLogic.getTokenMarketPool();
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

const getLiquidityPools = () => {
  return liquidityPools;
};

export const SwapTokenLogic = {
  estimateSwapValue,
  estimateValueFromInternalMarket,
  estimateLiquidityPoolValue,
  refreshTokenMarketPool,
  initAutoRefreshTokenMarketPool,
  getLiquidityPools,
};
