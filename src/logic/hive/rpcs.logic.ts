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

export enum HiveRpcDetailsTestName {
  GetVersion = "get_version",
  DbHeadState = "db_head_state",
  DbHeadAge = "db_head_age",
  DynamicGlobalProperties = "dynamic_global_properties",
  GetAccounts = "get_accounts",
  GetAccountHistory = "get_account_history",
  GetTransaction = "get_transaction",
  GetRcStats = "get_rc_stats",
  CustomJson = "custom_json",
  Transfer = "transfer",

  FeedHistory = "feed_history",
  GetRelationshipBetweenAccounts = "get_relationship_between_accounts",
  GetPost = "get_post",
  GetRankedByCreated = "get_ranked_by_created",
  GetRankedByTrending = "get_ranked_by_trending",
  GetAccountPostsByBlog = "get_account_posts_by_blog",
  GetAccountPostsByFeed = "get_account_posts_by_feed",
  GetAccountPostsByReplies = "get_account_posts_by_replies",
  GetCommunityPinnedAndMuted = "get_community_pinned_and_muted",
  GetActiveVotes = "get_active_votes",
}

export type HiveRpcDetails = {
  name: string;
  endpoint: string;
  version: string;
  updated_at: string;
  score: number;
  lastBlock: number;
  website_only: boolean;
  features: Array<string>;
  tests: Array<{
    name: HiveRpcDetailsTestName;
    description: string;
    type: "fetch" | "cast";
    method: string;
    success: boolean;
    features?: Array<string>;
  }>;
};

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
      fetchFromBeacon<HiveRpcStatus[]>("nodes"),
      fetchFromBeacon<RpcStatus[]>("he/nodes"),
      fetchFromBeacon<RpcStatus[]>("heh/nodes"),
      fetchFromBeacon<RcCosts>("rc/costs"),
    ]);
    const hiveDetails = await Promise.all(
      hive.map((h) => fetchFromBeacon<HiveRpcDetails>(`nodes/${h.name}`))
    );
    const hiveRescored = hive.map((rpc) => {
      const details = hiveDetails.find((d) => d.endpoint === rpc.endpoint);
      rpc = { ...rpc, ...rescoreHiveRpc(details) };
      return rpc;
    });

    const rpcs = {
      updatedAt: +Date.now(),
      hive: hiveRescored,
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
    console.log(e);
    console.log("Failed to update rpcs");
  }
};

const fetchFromBeacon = <T>(path: string): Promise<T> => {
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

function rescoreHiveRpc(details: HiveRpcDetails) {
  const scored = [
    HiveRpcDetailsTestName.GetVersion,
    HiveRpcDetailsTestName.DbHeadState,
    HiveRpcDetailsTestName.DbHeadAge,
    HiveRpcDetailsTestName.DynamicGlobalProperties,
    HiveRpcDetailsTestName.GetAccounts,
    HiveRpcDetailsTestName.GetAccountHistory,
    HiveRpcDetailsTestName.GetTransaction,
    HiveRpcDetailsTestName.GetRcStats,
    HiveRpcDetailsTestName.CustomJson,
    HiveRpcDetailsTestName.Transfer,
  ];
  const scoredTests = details.tests.filter((t) => scored.includes(t.name));
  const success = scoredTests.reduce((acc, t) => acc + (t.success ? 1 : 0), 0);
  const total = scoredTests.length;
  const fail = total - success;
  const score = Math.round((success * 100) / total);
  const failed = scoredTests.filter((t) => !t.success).map((t) => t.name);
  return { score, success, fail, failed };
}

export const RpcLogic = {
  getRPCs,
  initFetchRPCs,
};
