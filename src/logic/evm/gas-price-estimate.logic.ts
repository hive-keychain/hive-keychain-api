import * as fs from "fs";
import Logger from "hive-keychain-commons/lib/logger/logger";
import req from "request";

interface ChainGasFees {
  chainId: string;
  updatedAt: number;
  data: GasFees;
}

interface GasFees {
  low: GasFeeData;
  medium: GasFeeData;
  high: GasFeeData;
  estimatedBaseFee: string;
  networkCongestion: number;
  latestPriorityFeeRange: string[];
  historicalPriorityFeeRange: string[];
  historicalBaseFeeRange: string[];
  priorityFeeTrend: string;
  baseFeeTrend: string;
}

interface GasFeeData {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
}

const Auth = Buffer.from(
  process.env.INFURA_API_KEY + ":" + process.env.INFURA_API_KEY_SECRET
).toString("base64");

const getGasPriceEstimate = async (chainId: string) => {
  const gasFeeChainData = await getCurrentGasFees();
  const upToDateFeesForChainId = gasFeeChainData.find(
    (e) => e.chainId === chainId && ((+new Date() / 1000) | 0) < e.updatedAt + 0
  );
  if (upToDateFeesForChainId) {
    return upToDateFeesForChainId.data;
  } else {
    const data = await getGasDataFromInfura(chainId);
    saveGasFees([
      ...gasFeeChainData.filter((e) => e.chainId !== chainId),
      { chainId, updatedAt: (+new Date() / 1000) | 0, data },
    ]);
    return data;
  }
};

const getGasDataFromInfura = (chainId: string): Promise<GasFees> => {
  return new Promise((fulfill) => {
    req(
      {
        url: `https://gas.api.infura.io/networks/${parseInt(
          chainId
        )}/suggestedGasFees`,
        json: true,
        headers: { Authorization: `Basic ${Auth}` },
      },
      (err, http, body) => {
        if (err) {
          console.log(err);
          fulfill(null);
        } else {
          fulfill(body as GasFees);
        }
      }
    );
  });
};

const getCurrentGasFees = async () => {
  try {
    return JSON.parse(
      await fs
        .readFileSync(__dirname + `/../../../json/gasFees.json`)
        .toString()
    ) as ChainGasFees[];
  } catch (e) {
    return [];
  }
};

const saveGasFees = async (newList: ChainGasFees[]) => {
  try {
    await fs.writeFile(
      __dirname + `/../../../json/gasFees.json`,
      JSON.stringify(newList),
      "utf8",
      () => Logger.info(`Updated gas fees list`)
    );
  } catch (e) {
    Logger.info("Failed to update gas fees list");
  }
};

export const GasPriceEstimateLogic = {
  getGasPriceEstimate,
};
