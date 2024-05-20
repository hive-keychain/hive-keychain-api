import * as fs from "fs";
import req from "request";
import { Config } from "../../config";

export interface RpcStatusResponse {
  updatedAt: number;
  hive: HiveRpcStatus[];
  hiveEngine: RpcStatus[];
  hiveEngineHistory: RpcStatus[];
  costs: RcCosts[];
}

export interface RpcStatus {
  name: string;
  endpoint: string;
  version: string;
  score: number;
  updated_at: string;
  success: number;
  fail: number;
  features: string[];
}

export interface HiveRpcStatus extends RpcStatus {
  lastBlock: number;
}

export interface RcCosts {
  timestamp: string;
  costs: RcCost[];
}

export interface RcCost {
  operation: string;
  rc_needed: number;
  hp_needed: number;
}

export enum RpcStatusType {
  hive = "hive",
  hiveEngine = "hiveEngine",
  hiveEngineHistory = "hiveEngineHistory",
}

const getRPCs = async (type?: RpcStatusType) => {
  const nodes: RpcStatusResponse =
    JSON.parse(
      await fs.readFileSync(__dirname + `/../../../json/rpcs.json`).toString()
    ) || {};
  if (!type) return nodes;
  else {
    const typedNodes = { updatedAt: nodes.updatedAt };
    typedNodes[type] = nodes[type];
    return typedNodes;
  }
};

const initFetchRPCs = () => {
  fetchRPCs();
  setInterval(() => {
    fetchRPCs();
  }, Config.rpcs.interval);
};

const fetchRPCs = async () => {
  try {
    const [hive, hiveEngine, hiveEngineHistory, costs] = await Promise.all([
      fetchFromBeacon("nodes"),
      fetchFromBeacon("he/nodes"),
      fetchFromBeacon("heh/nodes"),
      fetchFromBeacon("rc/costs"),
    ]);

    const rpcs = {
      updatedAt: +Date.now(),
      hive,
      hiveEngine,
      hiveEngineHistory,
      costs,
    };
    await fs.writeFile(
      __dirname + `/../../../json/rpcs.json`,
      JSON.stringify(rpcs),
      "utf8",
      () => console.log(`Updated rpcs`)
    );
  } catch (e) {
    console.log("Failed to update rpcs");
  }
};

const fetchFromBeacon = (path: string) => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://beacon.peakd.com/api/${path}`,
        json: true,
      },
      (err, http, body) => {
        if (err) {
          console.log("Failed to fetch beacon data", err);
        } else {
          fulfill(body);
        }
      }
    );
  });
};

export const RpcLogic = {
  getRPCs,
  initFetchRPCs,
};
