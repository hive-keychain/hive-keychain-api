import fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import fetch from "node-fetch";
import path from "path";

export type PriceChartPoint = [string, number];

export type PriceChartHistory = {
  "24h": PriceChartPoint[];
  "7d": PriceChartPoint[];
  "30d": PriceChartPoint[];
  "1y": PriceChartPoint[];
};

export type LivePriceSample = {
  coingeckoId: string;
  priceUsd: number;
};

type ChartAsset = "hive" | "hbd";
type PriceHistoryGranularity = "5m" | "1h" | "1d";
type ChartPoint = [number, number];

type PriceHistoryPoint = {
  coingeckoId: string;
  granularity: PriceHistoryGranularity;
  bucketAt: Date;
  priceUsd: number;
  sampledAt: Date;
};

type StoredBucket = {
  priceUsd: number;
  sampledAt: string;
};

type PriceHistoryStore = {
  history: Record<
    string,
    Record<PriceHistoryGranularity, Record<string, StoredBucket>>
  >;
  seeded: Record<string, string>;
};

const ASSET_COIN_IDS: Record<ChartAsset, string> = {
  hive: "hive",
  hbd: "hive_dollar",
};

const CHART_COIN_IDS = ["hive", "hive_dollar"] as const;
const PRICE_HISTORY_GRANULARITIES: PriceHistoryGranularity[] = [
  "5m",
  "1h",
  "1d",
];

const PRICE_HISTORY_5M_MS = 5 * 60 * 1000;
const PRICE_HISTORY_1H_MS = 60 * 60 * 1000;
const PRICE_HISTORY_1D_MS = 24 * 60 * 60 * 1000;
const PRICE_HISTORY_24H_MS = 24 * PRICE_HISTORY_1H_MS;
const PRICE_HISTORY_7D_MS = 7 * PRICE_HISTORY_1D_MS;
const PRICE_HISTORY_30D_MS = 30 * PRICE_HISTORY_1D_MS;
const PRICE_HISTORY_1Y_MS = 365 * PRICE_HISTORY_1D_MS;
const SEED_INTERVAL_MS = 15_000;

const CHART_HISTORY_FILE = path.join(
  __dirname,
  "../../../json/coingecko-price-history.json",
);

let historicalData: { hive: number[]; hbd: number[] } | undefined;
let store = emptyStore();
let seeding = false;
let seedTimer: NodeJS.Timeout | undefined;

const emptyGranularities = (): Record<
  PriceHistoryGranularity,
  Record<string, StoredBucket>
> => ({
  "5m": {},
  "1h": {},
  "1d": {},
});

function emptyStore(): PriceHistoryStore {
  return { history: {}, seeded: {} };
}

const priceHistoryBucketMs = (granularity: PriceHistoryGranularity) => {
  if (granularity === "5m") return PRICE_HISTORY_5M_MS;
  if (granularity === "1h") return PRICE_HISTORY_1H_MS;
  return PRICE_HISTORY_1D_MS;
};

const priceHistoryBucketStartMs = (sampledAtMs: number, bucketMs: number) =>
  Math.floor(sampledAtMs / bucketMs) * bucketMs;

const isPriceHistoryWindowShort = (
  points: ChartPoint[],
  windowMs: number,
  bucketMs: number,
  now: Date,
) => {
  if (points.length === 0) return true;
  let oldest = Number.POSITIVE_INFINITY;
  for (const [timestamp] of points) {
    if (timestamp < oldest) oldest = timestamp;
  }
  const windowStart = now.getTime() - windowMs;
  return oldest > windowStart + bucketMs;
};

const rowsFromChartPoints = (
  coingeckoId: string,
  granularity: PriceHistoryGranularity,
  points: ChartPoint[],
): PriceHistoryPoint[] => {
  const bucketMs = priceHistoryBucketMs(granularity);
  const byBucket = new Map<number, { priceUsd: number; sampledAt: number }>();
  for (const [timestamp, priceUsd] of points) {
    if (!Number.isFinite(timestamp) || !Number.isFinite(priceUsd)) continue;
    const bucketAt = priceHistoryBucketStartMs(timestamp, bucketMs);
    const existing = byBucket.get(bucketAt);
    if (!existing || timestamp >= existing.sampledAt) {
      byBucket.set(bucketAt, { priceUsd, sampledAt: timestamp });
    }
  }

  return [...byBucket.entries()].map(([bucketAt, value]) => ({
    coingeckoId,
    granularity,
    bucketAt: new Date(bucketAt),
    priceUsd: value.priceUsd,
    sampledAt: new Date(value.sampledAt),
  }));
};

const livePriceHistoryRows = (
  coingeckoId: string,
  priceUsd: number,
  sampledAt: Date,
): PriceHistoryPoint[] =>
  PRICE_HISTORY_GRANULARITIES.map((granularity) => {
    const bucketMs = priceHistoryBucketMs(granularity);
    return {
      coingeckoId,
      granularity,
      bucketAt: new Date(
        priceHistoryBucketStartMs(sampledAt.getTime(), bucketMs),
      ),
      priceUsd,
      sampledAt,
    };
  });

const retentionCutoff = (granularity: PriceHistoryGranularity, now: Date) => {
  const windowMs =
    granularity === "5m"
      ? PRICE_HISTORY_24H_MS
      : granularity === "1h"
        ? PRICE_HISTORY_30D_MS
        : PRICE_HISTORY_1Y_MS;
  return new Date(now.getTime() - windowMs);
};

const ensureCoin = (coingeckoId: string) => {
  if (!store.history[coingeckoId]) {
    store.history[coingeckoId] = emptyGranularities();
  }
  for (const granularity of PRICE_HISTORY_GRANULARITIES) {
    if (!store.history[coingeckoId][granularity]) {
      store.history[coingeckoId][granularity] = {};
    }
  }
};

const deleteExpiredPriceHistory = (now = new Date()) => {
  for (const coin of Object.values(store.history)) {
    for (const granularity of PRICE_HISTORY_GRANULARITIES) {
      const cutoff = retentionCutoff(granularity, now).getTime();
      const buckets = coin[granularity];
      if (!buckets) continue;
      for (const bucketAt of Object.keys(buckets)) {
        const bucketMs = Date.parse(bucketAt);
        if (!Number.isFinite(bucketMs) || bucketMs < cutoff) {
          delete buckets[bucketAt];
        }
      }
    }
  }
};

const saveStore = () => {
  const temporary = `${CHART_HISTORY_FILE}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(store));
    fs.renameSync(temporary, CHART_HISTORY_FILE);
  } catch (err) {
    Logger.error("failed to save chart price history", err);
  }
};

const upsertPriceHistory = (rows: PriceHistoryPoint[]) => {
  if (rows.length === 0) return;
  for (const row of rows) {
    ensureCoin(row.coingeckoId);
    const buckets = store.history[row.coingeckoId][row.granularity];
    const bucketAt = row.bucketAt.toISOString();
    const existing = buckets[bucketAt];
    if (existing) {
      const existingMs = Date.parse(existing.sampledAt);
      if (
        Number.isFinite(existingMs) &&
        existingMs >= row.sampledAt.getTime()
      ) {
        continue;
      }
    }
    buckets[bucketAt] = {
      priceUsd: row.priceUsd,
      sampledAt: row.sampledAt.toISOString(),
    };
  }
  deleteExpiredPriceHistory();
  saveStore();
};

const markPriceHistorySeeded = (
  coingeckoId: string,
  completedAt = new Date(),
) => {
  store.seeded[coingeckoId] = completedAt.toISOString();
  saveStore();
};

const parseBuckets = (
  value: unknown,
): Record<string, StoredBucket> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const buckets: Record<string, StoredBucket> = {};
  for (const [bucketAt, entry] of Object.entries(value)) {
    if (!Number.isFinite(Date.parse(bucketAt))) return undefined;
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return undefined;
    const priceUsd = (entry as { priceUsd?: unknown }).priceUsd;
    const sampledAt = (entry as { sampledAt?: unknown }).sampledAt;
    if (typeof priceUsd !== "number" || !Number.isFinite(priceUsd))
      return undefined;
    if (
      typeof sampledAt !== "string" ||
      !Number.isFinite(Date.parse(sampledAt))
    ) {
      return undefined;
    }
    buckets[bucketAt] = { priceUsd, sampledAt };
  }
  return buckets;
};

const parseCoin = (
  value: unknown,
):
  | Record<PriceHistoryGranularity, Record<string, StoredBucket>>
  | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const record = value as Record<string, unknown>;
  const coin = emptyGranularities();
  for (const granularity of PRICE_HISTORY_GRANULARITIES) {
    if (record[granularity] === undefined) continue;
    const buckets = parseBuckets(record[granularity]);
    if (!buckets) return undefined;
    coin[granularity] = buckets;
  }
  return coin;
};

const loadStore = () => {
  try {
    const raw = JSON.parse(fs.readFileSync(CHART_HISTORY_FILE, "utf-8"));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      store = emptyStore();
      return;
    }
    const historyValue = (raw as { history?: unknown }).history;
    const seededValue = (raw as { seeded?: unknown }).seeded;
    if (
      !historyValue ||
      typeof historyValue !== "object" ||
      Array.isArray(historyValue)
    ) {
      store = emptyStore();
      return;
    }
    if (
      !seededValue ||
      typeof seededValue !== "object" ||
      Array.isArray(seededValue)
    ) {
      store = emptyStore();
      return;
    }

    const history: PriceHistoryStore["history"] = {};
    for (const [coingeckoId, coinValue] of Object.entries(historyValue)) {
      const coin = parseCoin(coinValue);
      if (!coin) {
        store = emptyStore();
        return;
      }
      history[coingeckoId] = coin;
    }

    const seeded: Record<string, string> = {};
    for (const [coingeckoId, completedAt] of Object.entries(seededValue)) {
      if (
        typeof completedAt !== "string" ||
        !Number.isFinite(Date.parse(completedAt))
      ) {
        continue;
      }
      seeded[coingeckoId] = completedAt;
    }
    store = { history, seeded };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      Logger.error("failed to load chart price history", err);
    }
    store = emptyStore();
  }
};

const listPriceHistory = (
  coingeckoId: string,
  granularity: PriceHistoryGranularity,
  since: Date,
): Array<{ bucketAt: Date; priceUsd: number }> | null => {
  const buckets = store.history[coingeckoId]?.[granularity];
  if (!buckets) return [];
  const sinceMs = since.getTime();
  const rows: Array<{ bucketAt: Date; priceUsd: number }> = [];
  for (const [bucketAt, bucket] of Object.entries(buckets)) {
    const bucketMs = Date.parse(bucketAt);
    if (!Number.isFinite(bucketMs) || bucketMs < sinceMs) continue;
    if (!Number.isFinite(bucket.priceUsd)) return null;
    rows.push({ bucketAt: new Date(bucketMs), priceUsd: bucket.priceUsd });
  }
  rows.sort(
    (left, right) => left.bucketAt.getTime() - right.bucketAt.getTime(),
  );
  return rows;
};

const serializePriceHistory = (
  rows: Array<{ bucketAt: Date; priceUsd: number }>,
): PriceChartPoint[] | null => {
  const points: PriceChartPoint[] = [];
  for (const row of rows) {
    if (!Number.isFinite(row.priceUsd)) return null;
    points.push([row.bucketAt.toISOString(), row.priceUsd]);
  }
  return points;
};

const latestPriceBefore = (
  coingeckoId: string,
  granularity: PriceHistoryGranularity,
  since: Date,
): number | null => {
  const buckets = store.history[coingeckoId]?.[granularity];
  if (!buckets) return null;
  const sinceMs = since.getTime();
  let bestMs = Number.NEGATIVE_INFINITY;
  let priceUsd: number | null = null;
  for (const [bucketAt, bucket] of Object.entries(buckets)) {
    const bucketMs = Date.parse(bucketAt);
    if (!Number.isFinite(bucketMs) || bucketMs >= sinceMs) continue;
    if (!Number.isFinite(bucket.priceUsd) || bucketMs <= bestMs) continue;
    bestMs = bucketMs;
    priceUsd = bucket.priceUsd;
  }
  return priceUsd;
};

const carriedMidnightsBetween = (
  fromMs: number,
  toMs: number,
  priceUsd: number,
): Array<{ bucketAt: Date; priceUsd: number }> => {
  const points: Array<{ bucketAt: Date; priceUsd: number }> = [];
  let midnight =
    Math.floor(fromMs / PRICE_HISTORY_1D_MS) * PRICE_HISTORY_1D_MS +
    PRICE_HISTORY_1D_MS;
  while (midnight < toMs) {
    points.push({ bucketAt: new Date(midnight), priceUsd });
    midnight += PRICE_HISTORY_1D_MS;
  }
  return points;
};

const carryLastPriceAcrossMissingDays = (
  rows: Array<{ bucketAt: Date; priceUsd: number }>,
  since: Date,
  previousPriceUsd: number | null,
): Array<{ bucketAt: Date; priceUsd: number }> => {
  if (rows.length === 0) return rows;

  const filled: Array<{ bucketAt: Date; priceUsd: number }> = [];
  let anchorMs: number | null = null;
  let anchorPrice: number | null = null;
  if (
    previousPriceUsd !== null &&
    Number.isFinite(previousPriceUsd) &&
    rows[0].bucketAt.getTime() > since.getTime()
  ) {
    filled.push({ bucketAt: since, priceUsd: previousPriceUsd });
    anchorMs = since.getTime();
    anchorPrice = previousPriceUsd;
  }

  for (const row of rows) {
    if (anchorMs !== null && anchorPrice !== null) {
      filled.push(
        ...carriedMidnightsBetween(
          anchorMs,
          row.bucketAt.getTime(),
          anchorPrice,
        ),
      );
    }
    filled.push(row);
    anchorMs = row.bucketAt.getTime();
    anchorPrice = row.priceUsd;
  }
  return filled;
};

const emptyPriceHistory = (): PriceChartHistory => ({
  "24h": [],
  "7d": [],
  "30d": [],
  "1y": [],
});

const loadStoredPriceHistory = (
  coingeckoId: string,
): PriceChartHistory | null => {
  const now = Date.now();
  const ranges: Array<{
    key: keyof PriceChartHistory;
    granularity: PriceHistoryGranularity;
    since: Date;
  }> = [
    {
      key: "24h",
      granularity: "5m",
      since: new Date(now - PRICE_HISTORY_24H_MS),
    },
    {
      key: "7d",
      granularity: "1h",
      since: new Date(now - PRICE_HISTORY_7D_MS),
    },
    {
      key: "30d",
      granularity: "1h",
      since: new Date(now - PRICE_HISTORY_30D_MS),
    },
    {
      key: "1y",
      granularity: "1d",
      since: new Date(now - PRICE_HISTORY_1Y_MS),
    },
  ];
  const history = emptyPriceHistory();
  for (const range of ranges) {
    const rows = listPriceHistory(coingeckoId, range.granularity, range.since);
    if (!rows) return null;
    const series = carryLastPriceAcrossMissingDays(
      rows,
      range.since,
      latestPriceBefore(coingeckoId, range.granularity, range.since),
    );
    const points = serializePriceHistory(series);
    if (!points) return null;
    history[range.key] = points;
  }
  return history;
};

const chartPoints = (
  prices: Array<[number, number]> | undefined,
): ChartPoint[] => {
  if (!Array.isArray(prices)) {
    throw new Error("CoinGecko market chart missing prices");
  }
  return prices;
};

const isCoinNotFound = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  (error as { status?: unknown }).status === 404;

const fetchMarketChart = async (
  coingeckoId: string,
  params: { days: string; interval?: "hourly" | "daily" },
) => {
  const url = new URL(
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coingeckoId)}/market_chart`,
  );
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("days", params.days);
  if (params.interval) url.searchParams.set("interval", params.interval);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json();
  const errorCode = body?.status?.error_code;
  if (res.status === 404 || errorCode === 404) {
    throw Object.assign(new Error("Coin not found"), { status: 404 });
  }
  if (!res.ok || errorCode || body?.error) {
    throw new Error(
      String(body?.status?.error_message || body?.error || res.status),
    );
  }
  return body as { prices?: Array<[number, number]> };
};

const fetchMarketChartOrNull = async (
  coingeckoId: string,
  params: { days: string; interval?: "hourly" | "daily" },
) => {
  try {
    return await fetchMarketChart(coingeckoId, params);
  } catch (error) {
    if (isCoinNotFound(error)) return null;
    throw error;
  }
};

const seedAllPriceHistoryWindows = async (coingeckoId: string, now: Date) => {
  const windows: Array<{
    days: string;
    interval?: "hourly" | "daily";
    granularity: PriceHistoryGranularity;
  }> = [
    { days: "1", granularity: "5m" },
    { days: "30", interval: "hourly", granularity: "1h" },
    { days: "365", interval: "daily", granularity: "1d" },
  ];

  for (const window of windows) {
    const chart = await fetchMarketChartOrNull(coingeckoId, {
      days: window.days,
      ...(window.interval ? { interval: window.interval } : {}),
    });
    if (!chart) continue;
    upsertPriceHistory(
      rowsFromChartPoints(
        coingeckoId,
        window.granularity,
        chartPoints(chart.prices),
      ),
    );
  }

  markPriceHistorySeeded(coingeckoId, now);
  return { calls: 3 as const };
};

const seedCoingeckoPriceHistory = async (
  coingeckoId: string,
  now = new Date(),
) => {
  if (coingeckoId === ASSET_COIN_IDS.hbd) {
    return seedAllPriceHistoryWindows(coingeckoId, now);
  }

  const dayChart = await fetchMarketChartOrNull(coingeckoId, { days: "1" });
  if (!dayChart) {
    markPriceHistorySeeded(coingeckoId, now);
    return { calls: 1 as const, missing: true as const };
  }
  const dayPoints = chartPoints(dayChart.prices);
  upsertPriceHistory(rowsFromChartPoints(coingeckoId, "5m", dayPoints));
  if (
    isPriceHistoryWindowShort(
      dayPoints,
      PRICE_HISTORY_24H_MS,
      PRICE_HISTORY_5M_MS,
      now,
    )
  ) {
    markPriceHistorySeeded(coingeckoId, now);
    return { calls: 1 as const };
  }

  const hourChart = await fetchMarketChartOrNull(coingeckoId, {
    days: "30",
    interval: "hourly",
  });
  if (!hourChart) {
    markPriceHistorySeeded(coingeckoId, now);
    return { calls: 2 as const, missing: true as const };
  }
  const hourPoints = chartPoints(hourChart.prices);
  upsertPriceHistory(rowsFromChartPoints(coingeckoId, "1h", hourPoints));
  if (
    isPriceHistoryWindowShort(
      hourPoints,
      PRICE_HISTORY_30D_MS,
      PRICE_HISTORY_1H_MS,
      now,
    )
  ) {
    markPriceHistorySeeded(coingeckoId, now);
    return { calls: 2 as const };
  }

  const yearChart = await fetchMarketChartOrNull(coingeckoId, {
    days: "365",
    interval: "daily",
  });
  if (!yearChart) {
    markPriceHistorySeeded(coingeckoId, now);
    return { calls: 3 as const, missing: true as const };
  }
  const yearPoints = chartPoints(yearChart.prices);
  upsertPriceHistory(rowsFromChartPoints(coingeckoId, "1d", yearPoints));
  markPriceHistorySeeded(coingeckoId, now);
  return { calls: 3 as const };
};

const nextUnseededCoingeckoId = () =>
  CHART_COIN_IDS.find((coingeckoId) => !store.seeded[coingeckoId]) ?? null;

const stopSeedLoop = () => {
  if (!seedTimer) return;
  clearInterval(seedTimer);
  seedTimer = undefined;
};

const seedNext = async () => {
  if (seeding) return;
  const coingeckoId = nextUnseededCoingeckoId();
  if (!coingeckoId) {
    stopSeedLoop();
    return;
  }

  seeding = true;
  try {
    const result = await seedCoingeckoPriceHistory(coingeckoId);
    if ("missing" in result && result.missing) {
      Logger.info(
        `price history seed skipped (coin not found) for ${coingeckoId} (${result.calls} calls)`,
      );
    } else {
      Logger.info(
        `price history seeded for ${coingeckoId} (${result.calls} calls)`,
      );
    }
  } catch (error) {
    Logger.error("price history seed failed (will retry)", error);
  } finally {
    seeding = false;
  }

  if (!nextUnseededCoingeckoId()) stopSeedLoop();
};

const recordLivePrices = (
  samples: LivePriceSample[],
  sampledAt = new Date(),
) => {
  const rows: PriceHistoryPoint[] = [];
  for (const sample of samples) {
    const coingeckoId = sample.coingeckoId.trim();
    if (!coingeckoId || !Number.isFinite(sample.priceUsd)) continue;
    rows.push(...livePriceHistoryRows(coingeckoId, sample.priceUsd, sampledAt));
  }
  upsertPriceHistory(rows);
};

const getChartHistory = (asset: ChartAsset): PriceChartHistory | null =>
  loadStoredPriceHistory(ASSET_COIN_IDS[asset]);

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

const initFetchHistoricalData = () => {
  Logger.technical("Intializing fetch historical prices...");
  loadStore();
  void refreshHistoricalData();
  setInterval(
    () => {
      void refreshHistoricalData();
    },
    30 * 60 * 1000,
  );
  if (!nextUnseededCoingeckoId()) return;
  void seedNext();
  seedTimer = setInterval(() => {
    void seedNext();
  }, SEED_INTERVAL_MS);
};

const getHistoricalData = async () => historicalData;

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

export const HistoricalDataLogic = {
  get: getHistoricalData,
  getChart: getChartHistory,
  recordLivePrices,
  init: initFetchHistoricalData,
};
