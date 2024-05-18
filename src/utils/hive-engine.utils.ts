import Logger from "hive-keychain-commons/lib/logger/logger";
import fetch from "node-fetch";

export const getAllTokens = async (): Promise<Token[]> => {
  try {
    let tokens = [];
    let offset = 0;
    do {
      const newTokens = await getTokens(offset);
      tokens.push(...newTokens);
      offset += 1000;
    } while (tokens.length % 1000 === 0);
    return tokens;
  } catch (e) {
    Logger.error("failed fetching colors");
  }
};

const getTokens = async (offset: number) => {
  return (
    await get<any[]>({
      contract: "tokens",
      table: "tokens",
      query: {},
      limit: 1000,
      offset: offset,
      indexes: [],
    })
  ).map((t: any) => {
    return {
      ...t,
      metadata: JSON.parse(t.metadata),
    };
  });
};

const get = async <T>(
  params: TokenRequestParams,
  timeout: number = 10
): Promise<T> => {
  const url = `https://engine.rishipanthee.com/contracts`;
  return new Promise((resolve, reject) => {
    let resolved = false;
    fetch(url, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "find",
        params,
        id: 1,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (res && res.status === 200) {
          resolved = true;
          return res.json();
        }
      })
      .then((res: any) => {
        resolve(res.result as unknown as T);
      });

    setTimeout(() => {
      if (!resolved) {
        reject("html_popup_tokens_timeout");
      }
    }, timeout * 1000);
  });
};

type TokenRequestParamsContrat = "tokens" | "market";
type TokenRequestParamsTable =
  | "tokens"
  | "metrics"
  | "balances"
  | "delegations";

export interface TokenRequestParams {
  contract: TokenRequestParamsContrat;
  indexes: any[];
  limit: number;
  offset: number;
  query: any;
  table: TokenRequestParamsTable;
}

export interface Token {
  circulatingSupply: string;
  delegationEnabled: boolean;
  issuer: string;
  maxSupply: string;
  metadata: TokenMetadata;
  name: string;
  numberTransactions: number;
  precision: number;
  stakingEnabled: boolean;
  supply: string;
  symbol: string;
  totalStaked: string;
  undelegationCooldown: number;
  unstakingCooldown: number;
}

export interface TokenMetadata {
  url: string;
  icon: string;
  desc: string;
}
