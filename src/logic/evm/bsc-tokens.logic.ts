import { MoralisApi } from "../../utils/moralis";
import { EvmChain } from "./interfaces/evm-chain.interfaces";
import {
  EvmSmartContractInfoErc20,
  EVMSmartContractType,
} from "./interfaces/evm-smart-contracts.interface";
import { SmartContractsInfoLogic } from "./smart-contract-info.logic";

const getBscErc20 = async (
  walletAddress: string,
  chainId: EvmChain["chainId"]
) => {
  const erc20Tokens = await MoralisApi.get(
    `${walletAddress}/erc20?chain=${chainId}`
  );

  const metadata = await SmartContractsInfoLogic.getCurrentSmartContractList();
  for (const token of erc20Tokens) {
    if (
      !metadata.find(
        (m) =>
          m.contractAddress?.toLowerCase() === token.token_address.toLowerCase()
      )
    ) {
      metadata.push({
        type: EVMSmartContractType.ERC20,
        chainId: chainId,
        contractAddress: token.token_address,
        decimals: token.decimals,
        possibleSpam: token.possible_spam,
        verifiedContract: token.verified_contract,
        symbol: token.symbol,
        logo: token.logo,
        name: token.name,
      } as EvmSmartContractInfoErc20);
    }
  }
  SmartContractsInfoLogic.saveNewSmartContractsList(metadata);

  return erc20Tokens.map((token) => {
    return {
      type: EVMSmartContractType.ERC20,
      chainId: chainId,
      contractAddress: token.token_address,
      decimals: token.decimals,
      possibleSpam: token.possible_spam,
      verifiedContract: token.verified_contract,
      symbol: token.symbol,
      logo: token.logo,
      name: token.name,
    };
  });
};

// TODO parse
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
