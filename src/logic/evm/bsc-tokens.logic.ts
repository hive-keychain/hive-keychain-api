import { MoralisApi } from "../../utils/moralis";
import { EvmChain } from "./interfaces/evm-chain.interfaces";
import { EVMSmartContractType } from "./interfaces/evm-smart-contracts.interface";
import { SmartContractsInfoLogic } from "./smart-contract-info.logic";

const getBscErc20 = async (
  walletAddress: string,
  chainId: EvmChain["chainId"]
) => {
  const erc20Tokens = await MoralisApi.get(
    `${walletAddress}/erc20?chain=${chainId}`
  );

  const metadata = await SmartContractsInfoLogic.getCurrentSmartContractList();
  //   for (const token of erc20Tokens) {
  //     if (
  //       metadata.find(
  //         (m) =>
  //           m.contractAddress === token.token_address && m.chainId === chainId
  //       )
  //     ) {
  //     }
  //   }

  return erc20Tokens.map((token) => {
    return {
      ...token,
      type: EVMSmartContractType.ERC20,
      chainId: chainId,
      contractAddress: token.token_address,
    };
  });
};
const getBscNfts = async (
  walletAddress: string,
  chainId: EvmChain["chainId"]
) => {
  const nfts = await MoralisApi.get(`${walletAddress}/nft?chain=${chainId}`);

  return nfts.result;
};

export const BscTokensLogic = {
  getBscErc20,
  getBscNfts,
};
