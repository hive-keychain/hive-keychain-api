# AGENTS.md

Repo-local operating contract for AI coding agents working in `hive-keychain-api`.

This repository is a mixed API layer for Hive Keychain clients. It serves:
- Hive endpoints backed by SQL, JSON files, and external Hive/CoinGecko sources
- admin/config endpoints that read and write repo-local JSON files
- thin proxy endpoints for the separate EVM light-node service

## Repo Purpose And Ownership

- `src/index.ts` is the public mount list. A route is part of the API only if its `setupApis(app)` call is wired there.
- `src/api/**` owns HTTP method, path, alias, and parameter parsing.
- `src/logic/**` owns behavior and external integrations.
- `build/**` is generated output. Treat `src/**` as the source of truth unless the user explicitly asks for build artifacts.

## Canonical Sources

Read these first before changing behavior:

- mounted routes and startup behavior: `src/index.ts`
- access-control contract and auth header format: `src/middleware/access.middleware.ts`
- API documentation to keep in sync: `doc/APIs.md`
- Hive SQL logic: `src/logic/hive/**`
- EVM light-node adapter behavior: `src/logic/evm/light-node.logic.ts`
- file-backed data stores:
  - `ecosystem/dapps.json`
  - `json/settings/mobile.json`
  - `json/version/extension.json`
  - `json/version/mobile.json`
  - `json/tokensBackgroundColors.json`
  - `json/phishing-lists/keychain.json`

If code and docs disagree, fix both deliberately. Do not silently preserve drift.

## Scope Control

- Prefer minimal diffs tied directly to the request.
- Preserve legacy aliases unless the task explicitly removes them.
- Do not add new normalization layers around proxy responses unless this repo is intentionally taking ownership of that contract.
- Do not document unmounted route files as public API surface.

## API Contract Rules

Any change to one of the following must update `doc/APIs.md` in the same change:

- route path or HTTP method
- alias routes
- query or path parameter semantics
- auth requirements
- redirect behavior
- response envelope or payload shape
- file-backed fallback behavior

Rules:

- Mounted-route behavior wins over file names or old assumptions.
- If a proxy route drifts from the upstream service, either fix the proxy or document the drift explicitly.
- Do not rewrite docs toward aspirational behavior when the implementation currently does something else.

## File-Backed Data Rules

- Keep file-backed payloads backward compatible unless the task explicitly changes the contract.
- Reuse the owning logic module when changing behavior around:
  - mobile settings
  - version payloads
  - ecosystem dapps
  - phishing lists
  - token background colors
- Preserve current formatting conventions where practical:
  - `ecosystem/dapps.json` is pretty-printed
  - most other JSON files are compact
- Do not casually move or rename JSON file paths. Several handlers depend on exact locations and silent fallbacks.

## Auth And Security Rules

- Authenticated write routes use the `message` header parsed by `accessCheck`.
- The header is a base64-encoded JSON blob with `expirationDate` and `encoded`.
- Role checks are based on verifying Hive posting-key signatures for hardcoded allowlists. Do not weaken that behavior without explicit instruction.
- Treat phishing, redirect, and version/config write routes as security-sensitive surfaces.
- Avoid adding logs that expose signatures, secrets, or raw user security payloads.

## Hive And EVM Boundaries

- Hive witness and delegation behavior belongs in `src/logic/hive/**`. Keep SQL changes localized there.
- `EvmLightNodeLogic` is an adapter to the upstream light-node service. Keep proxy behavior thin and centralized there.
- `/chains` and `/evm/light-node/chains` should stay aligned because they both expose the same normalized chain list.
- Chain-list normalization for clients belongs in `EvmLightNodeLogic.getActiveChains()`, including:
  - synthetic Hive chain insertion
  - EVM chain id hex formatting
  - EIP-1559 to transaction-type mapping

## Validation Expectations

- There is no meaningful automated test suite in this repo today, so behavior changes should at least pass `npm run build`.
- For route changes, verify the handler and owning logic together instead of editing docs in isolation.
- If live verification depends on SQL, Hive RPC, CoinGecko, LiFi, or the external EVM light-node service and you cannot validate against them, say so explicitly.

## Default Working Sequence

For non-trivial tasks, follow this order:

1. Read `src/index.ts` to confirm the mounted public surface.
2. Read the owning `src/api/**` handler and `src/logic/**` implementation.
3. Identify whether the route is SQL-backed, file-backed, or proxy-backed.
4. Make the smallest change that preserves existing aliases and auth behavior.
5. Update `doc/APIs.md` in the same change when API behavior changes.

## When Unsure

- Prefer documenting a quirk over masking it.
- Ask before changing public route contracts or auth semantics.
