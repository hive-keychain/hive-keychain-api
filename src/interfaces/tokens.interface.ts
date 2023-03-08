export type TokenRequestParamsContrat =
  | "tokens"
  | "market"
  | "distribution"
  | "marketpools";
export type TokenRequestParamsTable =
  | "tokens"
  | "metrics"
  | "balances"
  | "delegations"
  | "batches"
  | "liquidityPositions"
  | "pools"
  | "buyBook"
  | "sellBook";

export interface TokenRequestParams {
  contract: TokenRequestParamsContrat;
  indexes: any[];
  limit: number;
  offset: number;
  query: any;
  table: TokenRequestParamsTable;
}

export interface LiquidityPool {
  _id: number;
  tokenPair: string;
  baseQuantity: number;
  baseVolume: number;
  quoteQuantity: number;
  quoteVolume: number;
  quotePrice: number;
  totalShares: number;
  precision: number;
  creator: string;
}

export const HIVE = "HIVE";
export const HBD = "HBD";
export const SWAP_HIVE = "SWAP.HIVE";
