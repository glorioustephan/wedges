# tomo-ui

`tomo-ui` is an MCP server and catalog toolchain for the UI source in `packages/ui`.

It requires Node.js 22+ because `@sqlite.org/sqlite-wasm` only supports modern Node runtimes and uses an in-memory database that is explicitly exported back to `catalog/tomo-ui.sqlite`.

## Commands

```bash
pnpm --filter @wedges/tomo-ui run parse-catalog
pnpm --filter @wedges/tomo-ui run build-db
pnpm --filter @wedges/tomo-ui run rebuild
pnpm --filter @wedges/tomo-ui run benchmark
pnpm --filter @wedges/tomo-ui run build
pnpm --filter @wedges/tomo-ui run start
```

## What It Builds

- JSON catalog artifacts in `catalog/`
- A persisted SQLite WASM database at `catalog/tomo-ui.sqlite`
- Normalized API, example, and style search tables with FTS-backed indices
- Exact-match lookup tables for component APIs, token ids/aliases, patterns, and style records
- Benchmark output at `benchmarks/results.json`

## MCP Tools

- `search_components`
- `get_component`
- `search_patterns`
- `search_tokens`
- `search_styles`
- `get_token`
- `list_categories`
- `find_by_dependency`

Search responses include evidence and a short rationale so agents can see what matched, for example an exact `Tabs.Trigger.before` subcomponent prop hit or a token-backed style hit like `overlay-focus`.
