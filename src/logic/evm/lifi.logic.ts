import {
  ChainType,
  config,
  createConfig,
  getChains as LifiGetChains,
  getQuote as LifiGetQuote,
  getStatus as LifiGetStatus,
  getTokens as LifiGetTokens,
  getTransactionHistory as LifiGetTransactionHistory,
  QuoteRequestFromAmount,
  SDKBaseConfig,
} from "@lifi/sdk";
import {
  GetStatusRequest,
  StatusResponse,
  TransactionAnalyticsRequest,
} from "@lifi/types";

type GetStatusRequestExtended = GetStatusRequest & { fromAddress?: string };

let lifiConfig: SDKBaseConfig;

let chains;
let tokens;

const initializeLifi = async () => {
  lifiConfig = await createConfig({
    // integrator: "hive-keychain",
    integrator: "li.fi-playground",
    apiKey: process.env.LIFI_API_KEY,
  });
  config.set(lifiConfig);
  setInterval(refreshChainsAndTokens, 1000 * 60 * 60);
  refreshChainsAndTokens();
};

const refreshChainsAndTokens = async () => {
  chains = await LifiGetChains({ chainTypes: [ChainType.EVM] });
  tokens = (
    await LifiGetTokens({ chainTypes: [ChainType.EVM], extended: true })
  ).tokens;
};

const getChains = async () => {
  return chains;
};

const getTokens = async (chainId: string) => {
  return tokens.filter((token) => token.chainId === chainId);
};
const getAllTokens = async () => {
  const result = {};
  for (const chain of Object.keys(tokens)) {
    result[chain] = tokens[chain].filter(
      (token) => token.volumeUSD24H > 200000,
    );
  }
  return result;
};

const getQuote = async (params: QuoteRequestFromAmount) => {
  try {
    const quote = await LifiGetQuote(params);
    console.log("[LIFI] Quote:", quote);
    return { result: quote, status: 200 };
  } catch (error) {
    console.log("[LIFI] Error:", error);
    return { error: "Error getting quote", status: 500 };
  }
};

const buildStatusRequestFromTransfer = (
  transfer: StatusResponse,
): GetStatusRequestExtended | undefined => {
  const fullTransfer = transfer as any;
  if (fullTransfer.transactionId) {
    return { taskId: fullTransfer.transactionId };
  }

  if (!fullTransfer.sending?.txHash) {
    return undefined;
  }

  const request: any = { txHash: fullTransfer.sending.txHash };
  if (fullTransfer.tool) {
    request.bridge = fullTransfer.tool;
  }
  if (fullTransfer.sending?.chainId) {
    request.fromChain = fullTransfer.sending.chainId;
  }
  if (fullTransfer.receiving?.chainId) {
    request.toChain = fullTransfer.receiving.chainId;
  }
  if (fullTransfer.fromAddress) {
    request.fromAddress = fullTransfer.fromAddress;
  }
  return request;
};

const verifyTransferStatus = async (transfer: StatusResponse) => {
  const request = buildStatusRequestFromTransfer(transfer);
  if (!request) {
    return {
      checked: false,
      consistent: null,
      error: "Missing taskId and txHash. Unable to verify transfer status.",
    };
  }

  try {
    const verified = await LifiGetStatus(request);
    return {
      checked: true,
      consistent: verified.status === transfer.status,
      status: verified.status,
      substatus: verified.substatus,
      details: verified,
    };
  } catch (error) {
    if ("txHash" in request && request.bridge) {
      const fallbackRequest: GetStatusRequestExtended = {
        txHash: request.txHash,
        fromChain: request.fromChain,
        toChain: request.toChain,
        fromAddress: request.fromAddress,
      };
      try {
        const verified = await LifiGetStatus(fallbackRequest);
        return {
          checked: true,
          consistent: verified.status === transfer.status,
          status: verified.status,
          substatus: verified.substatus,
          details: verified,
        };
      } catch (fallbackError: any) {
        return {
          checked: false,
          consistent: null,
          error:
            fallbackError?.message ??
            "Unable to verify transfer status from LiFi.",
        };
      }
    }
    return {
      checked: false,
      consistent: null,
      error: (error as any)?.message ?? "Unable to verify transfer status.",
    };
  }
};

const getHistory = async (params: TransactionAnalyticsRequest) => {
  try {
    const history = await LifiGetTransactionHistory(params);
    console.log(params);
    console.log(history);
    const transfersWithVerification = await Promise.all(
      history.transfers.map(async (transfer) => ({
        ...transfer,
        verification: await verifyTransferStatus(transfer),
      })),
    );

    return {
      status: 200,
      result: {
        wallet: params.wallet,
        transfers: transfersWithVerification,
        total: transfersWithVerification.length,
      },
    };
  } catch (error: any) {
    console.log("[LIFI] History error:", error);
    return {
      status: 500,
      error: error?.message ?? "Error getting history",
    };
  }
};

export const LifiLogic = {
  getQuote,
  initializeLifi,
  getChains,
  getTokens,
  getAllTokens,
  getHistory,
};
