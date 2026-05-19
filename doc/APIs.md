# API Reference

This documents the API surface mounted in `src/index.ts` as implemented in the current codebase. It focuses on each endpoint's route, auth, goal, and response shape.

Conventions:
- Only mounted routes are included. Route files that exist but are not wired in `src/index.ts` are excluded from the public surface.
- Most handlers return raw values from SQL, JSON files, external services, or the EVM light-node upstream. This repo does not use one shared response envelope.
- Authenticated write routes use a `message` header. The middleware expects base64-encoded JSON containing `expirationDate` and `encoded`, then verifies the signature against hardcoded Hive posting-key allowlists.
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
- Returns `503` with `{ error: "Prices not available" }` when the in-memory cache is empty or incomplete (for example before the first successful refresh or when `json/coingecko-prices.json` is missing).

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
- The canonical flat list is stored in `json/ecosystem/dapps.json` (JSON). On first read, if that file is missing but `json/hive-dapps.json` or `src/logic/ecosystem/hive-dapps.json` exists, the server creates `json/ecosystem/dapps.json` by copying those entries and setting `chainId` to `beeab0de00000000000000000000000000000000000000000000000000000000` (Hive).
- Dapps with referral links (`?ref=` in `url`) are shuffled to the front of each category.
- Non-referral dapps are also shuffled. Order is therefore intentionally unstable.
- The modern route returns all dapps across chains; the legacy route injects `:chain` as `chainId` filter.
- GET responses are sent as `application/json`.

---

### Create ecosystem dapp
#### `POST /ecosystem/new`
#### `POST /:chain/ecosystem/new`
**Auth**: `TEAM`

**Goal**: Append a new dapp entry to `json/ecosystem/dapps.json`.

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

**Goal**: Check the supplied domain, target address, and contract address against the loaded phishing datasets.

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

## VII) Not Mounted

The file `src/api/evm/smart-contracts-info.api.ts` defines additional EVM routes, but they are not part of the current public API surface because they are not mounted in `src/index.ts`.
