import Logger from "hive-keychain-commons/lib/logger/logger";
import { Config } from "../../../config";
import {
  Provider,
  SwapStep,
  SwapStepType,
} from "../../../interfaces/swap.interface";
import { LiquidityPool, SWAP_HIVE } from "../../../interfaces/tokens.interface";
import { Book, InternalMarketLogic } from "./internal-market.logic";
import { LiquidityPoolLogic } from "./liquidity-pool.logic";

let liquidityPools: LiquidityPool[] = [];

const estimateSwapValue = async (
  startToken: string,
  endToken: string,
  amount: number
): Promise<SwapStep[]> => {
  const swapEstimates = await Promise.all([
    SwapTokenLogic.estimateLiquidityPoolValue(startToken, endToken, amount),
    SwapTokenLogic.estimateValueFromInternalMarket(
      startToken,
      endToken,
      amount
    ),
  ]);

  let selectedSwapSteps: SwapStep[] = [];
  let maxEstimate = 0;

  console.log("------------estimateSwapValue------------");
  console.log(swapEstimates);
  console.log("------------------------");

  for (const steps of swapEstimates) {
    if (steps[steps.length - 1].estimate > maxEstimate) {
      selectedSwapSteps = steps;
    }
  }

  return selectedSwapSteps;
};

const estimateLiquidityPoolValue = (
  startToken: string,
  endToken: string,
  amount: number
): SwapStep[] => {
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
      const swapStep = estimateLiquidityPoolValue(
        startToken,
        SWAP_HIVE,
        amount
      );
      return [
        ...swapStep,
        ...estimateLiquidityPoolValue(
          SWAP_HIVE,
          endToken,
          swapStep[swapStep.length - 1].estimate
        ),
      ];
    }
  } else {
    num = liquidity.quoteQuantity * amount;
    den = liquidity.baseQuantity + amount;
  }

  const amountOut = num / den;
  return [
    {
      step: SwapStepType.SWAP_TOKEN,
      provider: Provider.LIQUIDITY_POOL,
      startToken: startToken,
      endToken: endToken,
      estimate: amountOut,
    },
  ];
};

const estimateValueFromInternalMarket = async (
  startToken: string,
  endToken: string,
  amount: number
) => {
  let totalSwapHive = 0;
  let filteredMarketItems = [];
  let startTokenRemaining = amount;

  const steps: SwapStep[] = [];

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

    if (startTokenRemaining === 0) {
      steps.push({
        step: SwapStepType.SELL_ON_HIVE_ENGINE_MARKET,
        provider: Provider.HIVE_ENGINE_INTERNAL_MARKET,
        startToken: startToken,
        endToken: SWAP_HIVE,
        estimate: totalSwapHive,
      });
      break;
    }
  }

  if (startToken === SWAP_HIVE) {
    totalSwapHive = amount;
  }

  if (endToken === SWAP_HIVE) return steps;

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

    if (totalSwapHiveRemaining === 0) {
      steps.push({
        step: SwapStepType.BUY_ON_HIVE_ENGINE_MARKET,
        provider: Provider.HIVE_ENGINE_INTERNAL_MARKET,
        startToken: SWAP_HIVE,
        endToken: endToken,
        estimate: totalEndToken,
      });
      return steps;
    }
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
