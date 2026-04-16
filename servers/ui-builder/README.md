# ui-builder

`ui-builder` is an MCP server and catalog toolchain for the UI source in `packages/ui`.

It requires Node.js 22+ because `@sqlite.org/sqlite-wasm` only supports modern Node runtimes and uses an in-memory database that is explicitly exported back to `catalog/ui-builder.sqlite`.

## Commands

```bash
pnpm --filter @wedges/ui-builder run parse-catalog
pnpm --filter @wedges/ui-builder run build-db
pnpm --filter @wedges/ui-builder run rebuild
pnpm --filter @wedges/ui-builder run benchmark
pnpm --filter @wedges/ui-builder run build
pnpm --filter @wedges/ui-builder run start
```

## What It Builds

- JSON catalog artifacts in `catalog/`
- A persisted SQLite WASM database at `catalog/ui-builder.sqlite`
- Compact build cards at `catalog/build-cards.json`
- Normalized API, example, and style search tables with FTS-backed indices
- Exact-match lookup tables for component APIs, token ids/aliases, patterns, and style records
- Benchmark output at `benchmarks/results.json`

## MCP Tools

- `search_components`
- `recommend_component`
- `get_component_card`
- `batch_get_components`
- `compare_components`
- `search_examples`
- `build_ui_context`
- `get_component`
- `search_patterns`
- `search_tokens`
- `search_styles`
- `get_token`
- `list_categories`
- `find_by_dependency`

`search_components` returns compact component cards with evidence and a short rationale so agents can see what matched, for example an exact `Tabs.Trigger.before` subcomponent prop hit or a token-backed style hit like `overlay-focus`.

`recommend_component` is the quickest path for questions like "which button should we use?" because it returns the single best match plus a few compact alternatives, or a clarification when the match is ambiguous.

`get_component_card` is the exact lookup path for the compact build card. `build_ui_context` is the page-building path; it bundles the best component, alternatives, examples, patterns, and composition steps so an agent can move from intent to implementation in one call, and still carries a clarification forward when the query is ambiguous.
