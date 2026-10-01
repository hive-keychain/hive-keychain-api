import Logger from "hive-keychain-commons/lib/logger/logger";
import fetch from "node-fetch";

export type PriceChartPoint = [string, number];

export type PriceChartHistory = {
  "24h": PriceChartPoint[];
  "7d": PriceChartPoint[];
};

type ChartAsset = "hive" | "hbd";

const COIN_IDS: Record<ChartAsset, string> = {
  hive: "hive",
  hbd: "hive_dollar",
};

const CHART_WINDOWS = [
  { category: "24h", days: 1 },
  { category: "7d", days: 7 },
] as const;

const STALE_CHART_MS = 36 * 60 * 60 * 1000;

let historicalData;
let chartHistory: Partial<Record<ChartAsset, PriceChartHistory>> = {};

const refreshHistoricalData = async () => {
  try {
    Logger.info("Fetching historical data");

    const [hive, hbd] = await Promise.all([
      fetchHistoricalData("hive"),
      fetchHistoricalData("hive_dollar"),
    ]);
    if (hive && hbd) {
      historicalData = { hive, hbd };
    }
  } catch (e) {
    Logger.error("failed to refresh historical data", e);
  }
};

const refreshChartHistory = async () => {
  try {
    Logger.info("Fetching chart price history");
    for (const asset of Object.keys(COIN_IDS) as ChartAsset[]) {
      const previous = chartHistory[asset];
      const next: PriceChartHistory = {
        "24h": previous?.["24h"] ?? [],
        "7d": previous?.["7d"] ?? [],
      };
      let updated = false;

      for (const window of CHART_WINDOWS) {
        const points = await fetchChartWindow(COIN_IDS[asset], window.days);
        if (points) {
          next[window.category] = points;
          updated = true;
        }
        await sleep(2000);
      }

      if (updated) {
        chartHistory[asset] = next;
      }
    }
  } catch (e) {
    Logger.error("failed to refresh chart price history", e);
  }
};

const refreshAllHistoricalData = async () => {
  await refreshHistoricalData();
  await refreshChartHistory();
};

const initFetchHistoricalData = () => {
  Logger.technical("Intializing fetch historical prices...");
  void refreshAllHistoricalData();
  setInterval(() => {
    void refreshAllHistoricalData();
  }, 30 * 60 * 1000);
};

const getHistoricalData = async () => {
  return historicalData;
};

const getChartHistory = (asset: ChartAsset): PriceChartHistory | undefined => {
  const history = chartHistory[asset];
  if (!history) {
    return undefined;
  }
  const hasSeries =
    history["24h"].length > 1 || history["7d"].length > 1;
  return hasSeries ? history : undefined;
};

const fetchHistoricalData = async (
  currency: string,
): Promise<number[] | undefined> => {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${currency}/ohlc?vs_currency=usd&days=1&precision=4`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const body = await res.json();
    if (body.status) {
      return undefined;
    }
    return body.map((e: number[]) => e[1]);
  } catch (e) {
    Logger.error(`failed to fetch historical data for ${currency}`, e);
    return undefined;
  }
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const fetchMarketChartOnce = async (
  coinId: string,
  days: number,
): Promise<ChartFetchResult> => {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&precision=4`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const body = await res.json();
  const errorMessage = body?.status?.error_message || body?.error;
  if (
    !res.ok ||
    body?.status?.error_code ||
    errorMessage ||
    !Array.isArray(body?.prices)
  ) {
    const detail = String(errorMessage || res.status);
    const retryable = res.status === 429 || /rate limit/i.test(detail);
    return { retryable, detail };
  }

  const points: PriceChartPoint[] = [];
  for (const entry of body.prices) {
    if (!Array.isArray(entry) || entry.length < 2) {
      continue;
    }
    const timestampMs = Number(entry[0]);
    const price = Number(entry[1]);
    if (!Number.isFinite(timestampMs) || !Number.isFinite(price)) {
      continue;
    }
    points.push([new Date(timestampMs).toISOString(), price]);
  }

  if (points.length <= 1) {
    return { retryable: false, detail: "not enough price points" };
  }
  return { points };
};

type ChartFetchResult =
  | { points: PriceChartPoint[] }
  | { retryable: boolean; detail: string };

const newestChartTimestamp = (points: PriceChartPoint[] | undefined) => {
  if (!points?.length) {
    return 0;
  }
  const timestamp = Date.parse(points[points.length - 1][0]);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const isFreshChart = (points: PriceChartPoint[] | undefined) =>
  Date.now() - newestChartTimestamp(points) < STALE_CHART_MS;

const withChartRetries = async (
  coinId: string,
  days: number,
  source: string,
  load: () => Promise<ChartFetchResult>,
): Promise<PriceChartPoint[] | undefined> => {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await load();
      if ("points" in result) {
        return result.points;
      }
      if (result.detail !== "not enough price points") {
        Logger.error(
          `failed to fetch ${source} chart history for ${coinId} (${days}d): ${result.detail}`,
        );
      }
      if (!result.retryable || attempt === maxAttempts) {
        return undefined;
      }
    } catch (e) {
      Logger.error(
        `failed to fetch ${source} chart history for ${coinId} (${days}d)`,
        e,
      );
      if (attempt === maxAttempts) {
        return undefined;
      }
    }
    await sleep(15000 * attempt);
  }
  return undefined;
};

const fetchMarketChart = (coinId: string, days: number) =>
  withChartRetries(coinId, days, "market", () =>
    fetchMarketChartOnce(coinId, days),
  );

const fetchOhlcChart = (coinId: string, days: number) =>
  withChartRetries(coinId, days, "ohlc", () => fetchOhlcChartOnce(coinId, days));

const fetchChartWindow = async (
  coinId: string,
  days: number,
): Promise<PriceChartPoint[] | undefined> => {
  const marketPoints = await fetchMarketChart(coinId, days);
  if (isFreshChart(marketPoints)) {
    return marketPoints;
  }

  const ohlcPoints = await fetchOhlcChart(coinId, days);
  if (isFreshChart(ohlcPoints)) {
    return ohlcPoints;
  }

  const marketTimestamp = newestChartTimestamp(marketPoints);
  const ohlcTimestamp = newestChartTimestamp(ohlcPoints);
  if (ohlcTimestamp > marketTimestamp) {
    return ohlcPoints;
  }
  return marketPoints ?? ohlcPoints;
};

const fetchOhlcChartOnce = async (
  coinId: string,
  days: number,
): Promise<ChartFetchResult> => {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}&precision=4`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const body = await res.json();
  const errorMessage = body?.status?.error_message || body?.error;
  if (!res.ok || body?.status?.error_code || errorMessage || !Array.isArray(body)) {
    const detail = String(errorMessage || res.status);
    const retryable = res.status === 429 || /rate limit/i.test(detail);
    return { retryable, detail };
  }

  const points: PriceChartPoint[] = [];
  for (const entry of body) {
    if (!Array.isArray(entry) || entry.length < 5) {
      continue;
    }
    const timestampMs = Number(entry[0]);
    const price = Number(entry[4]);
    if (!Number.isFinite(timestampMs) || !Number.isFinite(price)) {
      continue;
    }
    points.push([new Date(timestampMs).toISOString(), price]);
  }

  if (points.length <= 1) {
    return { retryable: false, detail: "not enough price points" };
  }
  return { points };
};

export const HistoricalDataLogic = {
  get: getHistoricalData,
  getChart: getChartHistory,
  init: initFetchHistoricalData,
};
