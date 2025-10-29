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

const getBscNfts = async (
  walletAddress: string,
  chainId: EvmChain["chainId"]
) => {
  let nfts: any[] = [];
  let cursor = null;

  do {
    const res = await MoralisApi.get(
      `${walletAddress}/nft?chain=${chainId}&format=decimal&limit=100&normalizeMetadata=true&media_items=true&include_prices=false&cursor=${cursor}`
    );
    nfts = [...nfts, ...res.result];
    cursor = res.cursor;
  } while (cursor !== null);

  return nfts
    ? nfts.map((nft) => {
        return {
          type: nft.contract_type,
          contractAddress: nft.token_address,
          possibleSpam: nft.possible_spam,
          verifiedContract: nft.verified_collection,
          name: nft.name,
          symbol: nft.symbol,
          chainId: chainId,
          logo: nft.collection_logo,
          tokenId: nft.token_id,
          amount: nft.amount,
          metadata: nft.metadata ? JSON.parse(nft.metadata) : null,
        };
      })
    : [];
};

export const BscTokensLogic = {
  getBscErc20,
  getBscNfts,
};
