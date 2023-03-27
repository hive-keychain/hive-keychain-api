import fetch from "cross-fetch";
import { TokenRequestParams } from "../interfaces/tokens.interface";

const accountHistoryApi = "https://history.hive-engine.com";

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
        if (res && res.result) resolve(res.result as unknown as T);
      });

    setTimeout(() => {
      if (!resolved) {
        reject(new Error("Timeout"));
      }
    }, timeout * 1000);
  });
};

const getHistory = async (
  account: string,
  symbol: string,
  offset: number = 0,
  type: string = "user",
  timeout: number = 10
): Promise<any[]> => {
  const queryParams = `account=${account}&symbol=${symbol}&offset=${offset}&type=${type}`;

  const url = `${accountHistoryApi}/accountHistory?${queryParams}`;
  return new Promise((resolve, reject) => {
    let resolved = false;
    fetch(url)
      .then((res) => {
        if (res && res.status === 200) {
          resolved = true;
          return res.json();
        }
      })
      .then((res: any) => {
        resolve(res as any);
      });

    setTimeout(() => {
      if (!resolved) {
        reject(new Error("html_popup_tokens_timeout"));
      }
    }, timeout * 1000);
  });
};

export const HiveEngineUtils = {
  get,
  getHistory,
};
