# API Reference

This documents the API surface mounted in `src/index.ts` as implemented in the current codebase. It focuses on each endpoint's route, auth, goal, and response shape.

Conventions:
- Only mounted routes are included. Route files that exist but are not wired in `src/index.ts` are excluded from the public surface.
- Most handlers return raw values from SQL, JSON files, external services, or the EVM light-node upstream. This repo does not use one shared response envelope.
- Authenticated write routes use a `message` header. The middleware expects base64-encoded JSON containing `expirationDate` and `encoded`, then verifies the signature against hardcoded Hive posting-key allowlists.
- For `/evm/light-node/**` and `/evm/gasPriceEstimate/:chainId`, the route `:chainId` forwarded upstream is the decimal EVM chain id (`1`, `10`, `137`, ...).
- `/chains` and `/evm/light-node/chains` return normalized chain metadata for clients. EVM `chainId` values in those responses are hex strings such as `0x1`, not decimal ids.
- A few routes send file contents directly instead of normalized JSON objects. Those quirks are called out inline.

## I) General

### Health check
#### `GET /health`
**Goal**: Liveness probe for the API process.

**Response**
```json
{ "status": "ok" }
```

---

### Active chains
#### `GET /chains`
#### `GET /evm/light-node/chains`
**Goal**
- Return the client-facing active chain list.
- Include a synthetic Hive chain plus active EVM chains from the external light-node service.

**Response**: `Array<HiveChain | EvmChain>`
```ts
type HiveChain = {
  name: "HIVE";
  type: "HIVE";
  logo: string;
  chainId: string;
  mainTokens: {
    hbd: "HBD";
    hive: "HIVE";
    hp: "HP";
  };
  isPopular: true;
  active: true;
};

type EvmChain = {
  name: string;
  type: "EVM";
  logo: string;
  chainId: string; // hex string, e.g. "0x1"
  mainToken: string;
  defaultTransactionType: "0x0" | "0x1" | "0x2" | "0x3";
  blockExplorer?: {
    url: string;
    type: "BLOCKSCOUT" | "ETHERSCAN" | "AVALANCHE_SCAN";
  };
  blockExplorerApi?: {
    url: string;
    type: "BLOCKSCOUT" | "ETHERSCAN" | "AVALANCHE_SCAN";
  };
  network?: string;
  rpcs: Array<{ url: string; isDefault?: boolean }>;
  testnet?: boolean;
  isPopular?: boolean;
  isEth?: boolean;
  openSeaChainId?: string;
  active: boolean;
};
```

Notes:
- Both routes call the same logic and should be treated as aliases.
- Hive is injected locally; it does not come from the upstream EVM light-node service.

---

## II) Hive Data And Reference Endpoints

### Cached Hive prices
#### `GET /hive/v2/price`
**Goal**: Return the in-memory cached CoinGecko subset used by the clients.

**Response**: `HivePriceResponse`
```ts
type CachedCoinGeckoPrice = {
  usd: number;
  usd_24h_change: number;
  lastUpdateTimestamp?: number;
  lastUpdated?: string;
};

type HivePriceResponse = {
  hive: CachedCoinGeckoPrice;
  hive_dollar: CachedCoinGeckoPrice;
  bitcoin: CachedCoinGeckoPrice;
};
```

Notes:
- The seed file currently contains only `usd` and `usd_24h_change`.
- Timestamp fields appear only after the background refresh loop has written a refreshed payload.

---

### Hive price history
#### `GET /hive/v2/price-history`
**Goal**: Return recent 1-day OHLC-derived history for HIVE and HBD.

**Response**
```ts
type HivePriceHistoryResponse = {
  hive: number[];
  hbd: number[];
};
```

Notes:
- Values are built from CoinGecko OHLC data by taking the second value of each row.
- Until the first background fetch completes, the handler may return an empty body because the in-memory cache starts as `undefined`.

---

### Hive RPC endpoint
#### `GET /hive/rpc`
**Goal**: Return the configured Hive RPC URL from environment/config.

**Response**
```ts
{
  rpc: string | undefined;
}
```

---

### Hive Engine token background colors
#### `GET /hive/tokensBackgroundColors`
**Goal**: Return the cached symbol-to-dominant-color map used by clients.

**Response**
- The handler currently sends the raw file contents as a string, not a parsed object.
- The string content is serialized JSON with this logical shape:

```ts
type TokenBackgroundColorMap = Record<string, string>;
```

Example logical payload:
```json
{
  "HIVE": "#000000",
  "SWAP.HIVE": "#e31337"
}
```

Notes:
- Consumers that need object semantics should be prepared to `JSON.parse` the body.

---

### Hive phishing accounts
#### `GET /hive/phishingAccounts`
**Goal**: Return the packaged Hive phishing/bad-actor account list from `@hiveio/hivescript`.

**Response**
```ts
string[]
```

---

### Hive blacklisted domains
#### `GET /hive/blacklistedDomains`
**Goal**: Return the live JSON payload stored in the Hive post `@keys-defender/phishing-db`.

**Response**
```ts
unknown
```

Notes:
- This route is a pass-through from the post body JSON.
- The repo does not enforce a stable schema here.

---

### Incoming delegations
#### `GET /hive/delegators/:username`
**Goal**: Return the latest incoming delegation per delegator for a Hive user.

**Response**
```ts
type IncomingDelegation = {
  delegator: string;
  vesting_shares: string;
  delegation_date: string;
};
```

---

### Witness detail
#### `GET /hive/witness/:username`
**Goal**: Return the witness row plus reward aggregates and last confirmed block timestamp.

**Response**
```ts
type WitnessResponse = {
  lastWeekValue: string | number | null;
  lastMonthValue: string | number | null;
  lastYearValue: string | number | null;
  allValue: string | number | null;
  timestamp: string | null;
  [witnessColumn: string]: unknown;
} | null;
```

Notes:
- The response is a denormalized SQL row: aggregate fields plus columns from the `Witnesses` table.
- As currently implemented, `allValue` uses the same 7-day filter as `lastWeekValue`.

---

### Witness ranks (active only)
#### `GET /hive/witnesses-ranks`
**Goal**: Return ranked witness rows excluding inactive witnesses.

**Response**
```ts
type WitnessRank = {
  name: string;
  rank: number;
  votes: string | number;
  votes_count: number;
};
```

---

### Witness ranks v2
#### `GET /hive/v2/witnesses-ranks`
**Goal**: Return ranked witness rows including inactive witnesses, plus an `active_rank` for active ones.

**Response**
```ts
type WitnessRankV2 = {
  name: string;
  rank: number;
  votes: string | number;
  votes_count: number;
  signing_key: string;
  url: string | null;
  active_rank?: number;
};
```

Notes:
- Inactive witnesses remain in the list.
- `active_rank` is present only when `signing_key` is not the all-ones inactive key.

---

### Hive invoice redirect
#### `GET /hive/invoice/:op`
**Goal**: Redirect browser/deep-link clients to the Hive signing URI for the requested encoded operation.

**Response**
- HTTP `302`
- `Location: hive://sign/op/:op`

---

## III) Version And Settings Endpoints

### Extension version payload
#### `GET /hive/last-extension-version`
#### `GET /last-extension-version`
**Goal**: Return the current extension release payload stored in `json/version/extension.json`.

**Response**: logical JSON shape
```ts
type VersionFeature = {
  title?: string;
  description?: string;
  image?: string;
  anchor?: string;
  extraInformation?: string;
  overrideReadMoreLabel?: string;
  externalUrl?: string;
};

type VersionPayload = {
  version: string;
  url: string;
  features?: Record<string, VersionFeature[]>;
  [key: string]: unknown;
};
```

Notes:
- The handler sends the file contents directly from `fs.readFileSync()`.
- In practice the payload is JSON, but the route does not wrap or normalize it.

---

### Update extension version payload
#### `POST /hive/set-last-extension-version`
#### `POST /set-last-extension-version`
**Auth**: `ADMIN`

**Goal**: Overwrite `json/version/extension.json` with the request body.

**Request body**
```ts
VersionPayload
```

**Response**
```ts
{ status: 200; message: "Success" }
```

On caught write error:
```ts
{ status: 500; message: string }
```

Notes:
- The body is not schema-validated before being written.

---

### Mobile version payload
#### `GET /hive/last-version-mobile`
#### `GET /last-version-mobile`
**Goal**: Return the current mobile release payload stored in `json/version/mobile.json`.

**Response**
```ts
VersionPayload
```

Notes:
- Same behavior and caveats as the extension-version read routes.

---

### Update mobile version payload
#### `POST /hive/set-last-version-mobile`
#### `POST /set-last-version-mobile`
**Auth**: `ADMIN`

**Goal**: Overwrite `json/version/mobile.json` with the request body.

**Request body**
```ts
VersionPayload
```

**Response**
```ts
{ status: 200; message: "Success" }
```

On caught write error:
```ts
{ status: 500; message: string }
```

---

### Mobile settings
#### `GET /mobile-settings`
**Goal**: Return the parsed mobile settings JSON.

**Response**
```ts
Record<string, unknown>
```

Notes:
- If `json/settings/mobile.json` is missing or invalid, the route returns `{}`.

---

### Edit mobile settings
#### `POST /mobile-settings/edit`
**Auth**: `TEAM`

**Goal**: Overwrite `json/settings/mobile.json` with the request body.

**Request body**
```ts
Record<string, unknown>
```

**Response**
```ts
{ status: 200 }
```

Notes:
- The body is stored as-is and is not schema-validated.

---

## IV) Ecosystem Endpoints

### Ecosystem dapps
#### `GET /ecosystem/dapps`
#### `GET /:chain/ecosystem/dapps`
**Goal**
- Return dapps grouped by category.
- The legacy route filters the source list to one `chainId` before grouping.

**Response**: `EcosystemCategory[]`
```ts
type Dapp = {
  id: number;
  chainId: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  mobileUrl: string;
  categories: string[];
  active: boolean;
  order: number;
  hideOniOS?: boolean;
};

type EcosystemCategory = {
  category: string;
  dapps: Dapp[];
};
```

Notes:
- Dapps with referral links (`?ref=` in `url`) are shuffled to the front of each category.
- Non-referral dapps are also shuffled. Order is therefore intentionally unstable.
- The modern route returns all dapps across chains; the legacy route injects `:chain` as `chainId` filter.

---

### Create ecosystem dapp
#### `POST /ecosystem/new`
#### `POST /:chain/ecosystem/new`
**Auth**: `TEAM`

**Goal**: Append a new dapp entry to `ecosystem/dapps.json`.

**Request body**
```ts
type CreateDappBody = Omit<Dapp, "id" | "chainId"> & {
  chainId?: string;
};
```

Legacy-route note:
- `/:chain/ecosystem/new` ignores `body.chainId` and forces `chainId = req.params.chain`.

**Response**
```ts
{ status: 200 }
```

Notes:
- `id` is assigned as the next numeric id within that chain.
- Missing `chainId` is only logged; the route still returns `200`.

---

### Edit ecosystem dapp
#### `POST /ecosystem/edit`
#### `POST /:chain/ecosystem/edit`
**Auth**: `TEAM`

**Goal**: Replace a dapp entry matching `(chainId, id)`.

**Request body**
```ts
type EditDappBody = Dapp;
```

Legacy-route note:
- `/:chain/ecosystem/edit` overwrites `body.chainId` with `req.params.chain`.

**Response**
```ts
{ status: 200 }
```

---

### Delete ecosystem dapp
#### `POST /ecosystem/delete`
#### `POST /:chain/ecosystem/delete`
**Auth**: `TEAM`

**Goal**: Remove a dapp entry matching `(chainId, id)`.

**Request body**
```ts
type DeleteDappBody = {
  id: number;
  chainId?: string;
};
```

Legacy-route note:
- `/:chain/ecosystem/delete` overwrites `body.chainId` with `req.params.chain`.

**Response**
```ts
{ status: 200 }
```

---

## V) Swap-Cryptos Endpoints

These routes currently merge provider data from `SIMPLESWAP` and `STEALTHEX`.

### Supported swap currencies
#### `GET /swap-cryptos/currencies`
**Goal**: Return the cached merged list of currencies currently paired against HIVE.

**Response**
```ts
type ExchangeableToken = {
  name: string;
  symbol: string;
  network: string;
  icon: string;
  precision: number;
  displayedNetwork: string;
  legacySymbol?: string;
  exchanges: Array<
    "STEALTHEX" | "SIMPLESWAP" | "LETS_EXCHANGE" | "CHANGELLY"
  >;
};
```

Notes:
- The in-memory list is refreshed on an hourly interval.
- Although the shared type allows more providers, this repo currently instantiates only `SIMPLESWAP` and `STEALTHEX`.

---

### Swap min/max range
#### `GET /swap-cryptos/range/:tokenFrom/:networkFrom/:tokenTo/:networkTo`
**Goal**: Return min/max supported amounts per provider for a pair.

**Response**
```ts
type ExchangeMinMaxAmount = {
  provider: "STEALTHEX" | "SIMPLESWAP" | "LETS_EXCHANGE" | "CHANGELLY";
  min: number | null;
  max: number | null;
};
```

Notes:
- Unsupported providers for the requested pair are omitted from the array.

---

### Swap estimation
#### `GET /swap-cryptos/estimate/:amount/:tokenFrom/:networkFrom/:tokenTo/:networkTo`
**Goal**: Return provider estimates for the requested amount and pair.

**Response**
```ts
type ExchangeEstimation = {
  provider: "STEALTHEX" | "SIMPLESWAP" | "LETS_EXCHANGE" | "CHANGELLY";
  estimation: {
    swapCrypto: "STEALTHEX" | "SIMPLESWAP" | "LETS_EXCHANGE" | "CHANGELLY";
    from: string;
    to: string;
    amount: number;
    estimation: number;
    link: string;
    logoName: string;
    name: string;
  };
};
```

Notes:
- Results are sorted descending by estimated output amount.
- If no provider can price the pair, the handler may send `undefined`.

---

## VI) EVM Security And LiFi Endpoints

### Verify EVM transaction targets
#### `GET /evm/verify-transaction`
**Query params**
- `domain?`
- `to?`
- `contract?`
- `chainId?` (currently not used by the verification logic)

**Goal**: Check the supplied domain, target address, and contract address against the loaded phishing datasets and proxy detection.

**Response**
```ts
type VerifyTransactionResponse = {
  domain?: {
    isBlacklisted: boolean;
    isWhitelisted: boolean;
    fuzzy?: string;
  };
  to?: {
    isBlacklisted: boolean;
  };
  contract?: {
    isBlacklisted: boolean;
    proxy: { target: string } | null;
  };
};
```

Notes:
- Omitted query params produce omitted or `undefined` sub-objects.

---

### Keychain phishing list
#### `GET /evm/keychain-phishing-list`
#### `POST /evm/keychain-phishing-list`
**Auth**
- `GET`: none
- `POST`: none in the current implementation

**Goal**
- `GET`: return the repo-local phishing allow/block/fuzzy lists
- `POST`: overwrite the repo-local phishing list file

**Payload shape**
```ts
type EvmPhishingList = {
  whitelist: string[];
  blacklist: string[];
  fuzzylist: string[];
  tolerance: number;
  version: number;
};
```

`POST` success response:
```ts
{ status: 200; message: "Successfully saved" }
```

Notes:
- The code reads and writes `json/phishing-lists/keychain.json`.
- If that file is missing or unreadable, `GET` falls back to:

```json
{
  "whitelist": [],
  "blacklist": [],
  "fuzzylist": [],
  "version": 0,
  "tolerance": 0
}
```

---

### LiFi quote
#### `POST /evm/lifi/quote`
**Goal**: Return a LiFi quote for a simple from-amount request.

**Request body**
```ts
type LifiQuoteRequest = {
  fromChain: number | string;
  fromToken: string;
  fromAddress?: string;
  amount: string;
  toChain: number | string;
  toToken: string;
  toAddress?: string;
};
```

**Response**
- On success: raw LiFi quote payload from the SDK.
- On quote error: the logic still returns HTTP `200` with:

```ts
{
  errorCode?: string;
  errorMessage?: string;
}
```

---

### LiFi chains
#### `GET /evm/lifi/chains`
**Goal**: Return the cached raw LiFi EVM chain list.

**Response**
```ts
unknown[]
```

Notes:
- The route forwards the cached LiFi SDK chain objects without local normalization.

---

### LiFi tokens for one chain
#### `GET /evm/lifi/tokens/:chainId`
**Goal**: Return the cached LiFi token list for one chain.

**Current implementation note**
- `src/logic/evm/lifi.logic.ts` currently treats the cached LiFi token store as an array here, while the SDK cache is hydrated as a per-chain token map.
- In practice this route should be treated as unstable until that drift is corrected.

---

### LiFi history
#### `GET /evm/lifi/history`
**Query params**
- `wallet` required
- `status?`
- `fromTimestamp?` unix timestamp
- `toTimestamp?` unix timestamp

**Goal**: Return LiFi transfer history, remapped into the shared Hive Keychain history shape.

**Response**
```ts
type LifiHistoryStatus = "PENDING" | "DONE" | "FAILED" | "INVALID";

type LifiHistoryToken = {
  address?: string;
  chainId?: number;
  symbol?: string;
  decimals?: number;
  name?: string;
  coinKey?: string;
  logoURI?: string;
  priceUSD?: string;
};

type LifiHistoryTransferSide = {
  token?: LifiHistoryToken;
  chainId?: number;
  amountUSD?: string;
  amount?: string;
  timestamp?: number;
};

type LifiHistoryItem = {
  transactionId?: string;
  lifiExplorerLink?: string;
  status: LifiHistoryStatus;
  substatus?: string;
  receiving?: LifiHistoryTransferSide;
  sending?: LifiHistoryTransferSide;
};

type LifiHistoryResponse = {
  transfers: LifiHistoryItem[];
};
```

Error responses:
- missing `wallet`: HTTP `400` with `{ error: "Missing wallet query parameter" }`
- LiFi SDK/history failure: HTTP `500` with `{ error: string }`

---

### LiFi cached data
#### `GET /evm/lifi/data`
**Goal**: Return both cached LiFi chains and the cached extended token map.

**Response**
```ts
{
  chains: unknown[];
  tokens: Record<string, unknown[]>;
}
```

Notes:
- `tokens` is the raw per-chain LiFi token map, keyed by chain id.

---

## VII) EVM Light-Node Proxy Endpoints

These routes proxy to `process.env.EVM_LIGHT_NODE_API_URL` through `src/logic/evm/light-node.logic.ts`.

### Register address
#### `GET /evm/light-node/register-address/:chainId/:address/:newAddress`
**Goal**
- Call the upstream light-node registration route.
- Hide the upstream registration payload and return a simple local success envelope.

**Path params**
- `:chainId`: decimal EVM chain id
- `:address`: EVM address
- `:newAddress`: must be a JSON boolean literal string, typically `true` or `false`

**Response**
```json
{ "result": "ok" }
```

Notes:
- This local route uses `GET`, but the upstream light-node registration path is called with `POST`.
- The handler does `JSON.parse(req.params.newAddress)`, so the param is effectively required in practice even though the route token is marked optional.
- Upstream registration details are discarded.

---

### Token discovery
#### `GET /evm/light-node/discovery/tokens/:chainId/:address`
**Goal**: Return token discovery data from the upstream light-node service.

**Response**
```ts
type CatchupStatus = "SKIPPED" | "RUNNING" | "DONE" | "PARTIAL" | "ERROR";

type DiscoveryTokensResponse = {
  chainId: number;
  address: string;
  catchupStatus: CatchupStatus | null;
  pricingStatus: "READY" | "PARTIAL" | "PENDING";
  tokens: EvmSmartContractInfoFungible[];
};

type EvmSmartContractInfoFungible = {
  type: "ERC20" | "NATIVE";
  chainId: string;
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
  balance: string;
  formattedBalance?: string;
  priceUsd: number | null;
  balanceUsd: string | null;
  isNativeWrapped: boolean;
};

type EvmSmartContractInfoErc20 = EvmSmartContractInfoFungible & {
  type: "ERC20";
  lpV2?: {
    token0: {
      address: string;
      name: string | null;
      symbol: string | null;
      decimals: number | null;
      logo: string;
    };
    token1: {
      address: string;
      name: string | null;
      symbol: string | null;
      decimals: number | null;
      logo: string;
    };
    factoryAddress?: string;
  };
};
```

Notes:
- This proxy does not add local normalization beyond forwarding the upstream JSON.

---

### NFT discovery
#### `GET /evm/light-node/discovery/nfts/:chainId/:address`
**Goal**: Return NFT collections owned by an address from the upstream light-node service.

**Response**
```ts
type NftDiscoveryResponse = {
  chainId: number;
  address: string;
  catchupStatus: string | null;
  collections: NftDiscoveryCollection[];
};

type NftDiscoveryCollection = {
  contractAddress: string;
  contractType: "ERC721" | "ERC1155" | "UNKNOWN";
  name: string | null;
  symbol: string | null;
  verifiedContract: boolean;
  possibleSpam: boolean;
  nfts: Array<{
    tokenId: string;
    balance: string;
    name: string | null;
    imageUrl: string | null;
  }>;
};
```

---

### NFT detail
#### `GET /evm/light-node/nft/detail/:chainId/:nftId`
**Goal**: Return one NFT detail record from the upstream light-node service.

**Important implementation detail**
- The local route parameter names are misleading.
- `:chainId` is forwarded as the upstream `collectionAddress`.
- `:nftId` is forwarded as the upstream `tokenId`.
- There is no real chain id in this lookup path.

**Response**
```ts
type NftDetail = {
  contractAddress: string;
  contractType: "ERC721" | "ERC1155" | "UNKNOWN";
  tokenId: string;
  collectionName: string | null;
  collectionSymbol: string | null;
  verifiedContract: boolean;
  possibleSpam: boolean;
  balance: string | null;
  name: string | null;
  imageUrl: string | null;
  traits: unknown | null;
  mintBlock: number | null;
};
```

---

### Address history
#### `GET /evm/light-node/history/:chainId/:address`
**Goal**
- Return transaction history from the upstream light-node service.
- Support only the subset of pagination query params that this proxy forwards.

**Supported query params**
- `limit?`
- `cursor?`

**Response**
```ts
type HistoryItem = {
  txId: string;
  blockNumber: number;
  blockTime: string;
  opIndex: string;
  opName: string;
  in: HistoryFlow[];
  out: HistoryFlow[];
  status: "SUCCESS" | "REVERTED" | null;
  fromAddress: string | null;
  toAddress: string | null;
  action?: string;
};

type HistoryFlow =
  | {
      kind: "NATIVE";
      amountWei: string;
      amount: string;
      verified: boolean;
      possibleSpam: boolean;
    }
  | {
      kind: "ERC20";
      tokenAddress: string;
      symbol: string | null;
      amount: string;
      infinite?: boolean;
      verified: boolean;
      possibleSpam: boolean;
    }
  | {
      kind: "ERC721";
      collectionAddress: string;
      collectionName: string | null;
      tokenId: string;
      quantity: "1";
      verified: boolean;
      possibleSpam: boolean;
    }
  | {
      kind: "ERC1155";
      collectionAddress: string;
      collectionName: string | null;
      tokenId: string;
      quantity: string;
      verified: boolean;
      possibleSpam: boolean;
    };

type HistoryResponse = {
  items: HistoryItem[];
  nextCursor: string | null;
};
```

Notes:
- Unlike the upstream light-node API, this proxy currently forwards only `limit` and `cursor`.
- Flags such as `showPossibleSpam` and `showUnverified` are not forwarded by this repo.

---

### Transaction detail
#### `GET /evm/light-node/history/detail/:chainId/:txId`
**Goal**: Return all history rows for a transaction, including gas and token/NFT metadata.

**Response**
```ts
type HistoryDetailItem = {
  txId: string;
  blockNumber: number;
  blockTime: string;
  opIndex: string;
  opName: string;
  in: HistoryFlowWithMeta[];
  out: HistoryFlowWithMeta[];
  fromAddress: string | null;
  toAddress: string | null;
  action?: string;
  txStatus: "SUCCESS" | "REVERTED" | null;
  feeWei: string | null;
  gasUsed: string | null;
  effectiveGasPrice: string | null;
  status: number;
};

type HistoryFlowWithMeta =
  | HistoryFlow
  | {
      kind: "ERC20";
      tokenAddress: string;
      symbol: string | null;
      amount: string;
      infinite?: boolean;
      verified: boolean;
      possibleSpam: boolean;
      token?: {
        name: string | null;
        decimals: number | null;
        logoUrl: string | null;
      };
    }
  | {
      kind: "ERC721" | "ERC1155";
      collectionAddress: string;
      collectionName: string | null;
      tokenId: string;
      quantity: string;
      verified: boolean;
      possibleSpam: boolean;
      collection?: {
        name: string | null;
        symbol: string | null;
        verifiedContract: boolean;
        possibleSpam: boolean;
      };
      nft?: {
        name: string | null;
        imageUrl: string | null;
        traits: Record<string, unknown> | null;
      };
    };
```

---

### Contract information
#### `GET /evm/light-node/contract/:chainId/:contractAddress`
**Goal**: Return persisted contract information plus token/NFT metadata and optional price.

**Response**
```ts
type ContractResponse = {
  id: number;
  chainId: number;
  address: string;
  firstSeenBlock: number;
  lastSeenBlock: number | null;
  abi: unknown | null;
  contractType: string | null;
  verified: boolean | null;
  isProxy: boolean;
  proxyTargetAddress: string | null;
  proxyTarget: ContractResponse | null;
  possibleSpam: boolean | null;
  metadata:
    | null
    | {
        address: string;
        name: string | null;
        symbol: string | null;
        decimals?: number | null;
        logoUrl?: string | null;
        backgroundColor?: string;
        coingeckoId?: string | null;
        lpV2?: {
          token0: {
            address: string;
            name: string | null;
            symbol: string | null;
            decimals: number | null;
            logo: string;
            backgroundColor: string;
          };
          token1: {
            address: string;
            name: string | null;
            symbol: string | null;
            decimals: number | null;
            logo: string;
            backgroundColor: string;
          };
          factoryAddress?: string;
        };
      };
  price: null | {
    priceUsd: number;
    fetchedAt: string;
  };
};
```

---

### Gas oracle snapshot
#### `GET /evm/gasPriceEstimate/:chainId`
#### `GET /evm/light-node/gas-fee/:chainId`
**Goal**: Return a MetaMask-style gas oracle snapshot for a chain.

**Response**
```ts
type GasOracleResponse = {
  low: {
    suggestedMaxPriorityFeePerGas: string | null;
    suggestedMaxFeePerGas: string | null;
    maxWaitTimeEstimate: number;
  };
  medium: {
    suggestedMaxPriorityFeePerGas: string | null;
    suggestedMaxFeePerGas: string | null;
    maxWaitTimeEstimate: number;
  };
  high: {
    suggestedMaxPriorityFeePerGas: string | null;
    suggestedMaxFeePerGas: string | null;
    maxWaitTimeEstimate: number;
  };
  estimatedBaseFee: string | null;
  latestPriorityFeeRange: [string | null, string | null];
  historicalPriorityFeeRange: [string | null, string | null];
  historicalBaseFeeRange: [string | null, string | null];
  priorityFeeTrend: number;
  baseFeeTrend: number;
};
```

Notes:
- Both routes resolve through the same upstream gas-oracle path.

---

### Token or native price
#### `GET /evm/light-node/price/:chainId/:tokenAddress`
#### `GET /evm/light-node/price/:chainId`
**Goal**
- Return the latest stored token price when `:tokenAddress` is present.
- Return the latest stored native-token price when `:tokenAddress` is omitted.

**Response**
```ts
type EvmPriceResponse = {
  chainId: string;
  tokenAddress: string | null;
  priceUsd: number;
  fetchedAt: string;
};
```

Notes:
- The optional-token route is mounted before the required-token variant, so consumers should treat this as one route with an optional trailing `tokenAddress`.

---

### Native token metadata
#### `GET /evm/light-node/native/:chainId`
**Goal**: Return native-token metadata plus the latest stored USD price.

**Response**
```ts
type NativeTokenResponse = {
  chainId: number;
  metadata: {
    name: string;
    symbol: string | null;
    decimals: number;
    logoUrl: string | null;
    wrappedNativeTokenAddress?: string;
  };
  price: null | {
    priceUsd: number;
    fetchedAt: string;
  };
};
```

---

## VIII) Not Mounted

The file `src/api/evm/smart-contracts-info.api.ts` defines additional EVM routes, but they are not part of the current public API surface because they are not mounted in `src/index.ts`.
