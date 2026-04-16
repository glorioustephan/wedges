import { join } from "node:path";
import { performance } from "node:perf_hooks";

import { paths } from "../shared/paths.js";
import { readText, writeJson } from "../shared/utils.js";
import { CatalogSearchService } from "./service.js";

type GoldenQuery = {
  id: string;
  target: "components" | "tokens" | "patterns";
  query: string;
  relevant_ids: string[];
  filters?: Record<string, string>;
};

const precisionAt = (result_ids: string[], relevant_ids: string[], limit: number) => {
  const relevant = new Set(relevant_ids);
  return result_ids.slice(0, limit).filter((id) => relevant.has(id)).length / limit;
};

const ndcgAt = (result_ids: string[], relevant_ids: string[], limit: number) => {
  const relevant = new Set(relevant_ids);
  const dcg = result_ids.slice(0, limit).reduce((score, id, index) => {
    const gain = relevant.has(id) ? 1 : 0;
    return score + gain / Math.log2(index + 2);
  }, 0);
  const ideal = Array.from({ length: Math.min(relevant_ids.length, limit) }, (_, index) => index).reduce(
    (score, index) => score + 1 / Math.log2(index + 2),
    0
  );

  return ideal === 0 ? 0 : dcg / ideal;
};

const firstRelevantRank = (result_ids: string[], relevant_ids: string[]) => {
  const relevant = new Set(relevant_ids);
  const index = result_ids.findIndex((id) => relevant.has(id));
  return index === -1 ? null : index + 1;
};

export const runBenchmarks = async () => {
  const query_file = join(paths.benchmarks_dir, "golden-queries.json");
  const queries = JSON.parse(await readText(query_file)) as GoldenQuery[];
  const service = await CatalogSearchService.create();
  await service.warmup();

  try {
    const results = [];

    for (const query of queries) {
      if (query.target === "components") {
        const search = await service.search_components({
          query: query.query,
          category: query.filters?.category,
          framework: query.filters?.framework,
          status: query.filters?.status as "stable" | "preview" | "deprecated" | undefined,
          theme: query.filters?.theme as "light" | "dark" | undefined,
          limit: 10,
        });
        const result_ids = search.results.map((result) => result.item.component_id);
        results.push({
          id: query.id,
          query: query.query,
          target: query.target,
          relevant_ids: query.relevant_ids,
          result_ids,
          precision_at_5: precisionAt(result_ids, query.relevant_ids, 5),
          ndcg_at_10: ndcgAt(result_ids, query.relevant_ids, 10),
          first_relevant_rank: firstRelevantRank(result_ids, query.relevant_ids),
        });
        continue;
      }

      if (query.target === "tokens") {
        const search = await service.search_tokens({
          query: query.query,
          kind: query.filters?.kind as
            | "color"
            | "typography"
            | "spacing"
            | "radius"
            | "shadow"
            | "motion"
            | "z-index"
            | undefined,
          mode: query.filters?.mode,
          limit: 10,
        });
        const result_ids = search.results.map((result) => result.item.token_id);
        results.push({
          id: query.id,
          query: query.query,
          target: query.target,
          relevant_ids: query.relevant_ids,
          result_ids,
          precision_at_5: precisionAt(result_ids, query.relevant_ids, 5),
          ndcg_at_10: ndcgAt(result_ids, query.relevant_ids, 10),
          first_relevant_rank: firstRelevantRank(result_ids, query.relevant_ids),
        });
        continue;
      }

      const search = await service.search_patterns({
        query: query.query,
        limit: 10,
      });
      const result_ids = search.results.map((result) => result.item.pattern_id);
      results.push({
        id: query.id,
        query: query.query,
        target: query.target,
        relevant_ids: query.relevant_ids,
        result_ids,
        precision_at_5: precisionAt(result_ids, query.relevant_ids, 5),
        ndcg_at_10: ndcgAt(result_ids, query.relevant_ids, 10),
        first_relevant_rank: firstRelevantRank(result_ids, query.relevant_ids),
      });
    }

    const warm_operations = [
      {
        id: "get_component_card_button",
        run: () => service.get_component_card("button"),
      },
      {
        id: "recommend_component_button",
        run: () =>
          service.recommend_component({
            query: "which button should we use?",
            limit: 3,
          }),
      },
      {
        id: "build_ui_context_settings_form",
        run: () =>
          service.build_ui_context({
            query: "build a settings form",
            limit: 3,
          }),
      },
      {
        id: "search_examples_tabs",
        run: () =>
          service.search_examples({
            query: "tabs trigger",
            component: "tabs",
            limit: 3,
          }),
      },
    ] as const;

    const warm_operation_results = [];

    for (const operation of warm_operations) {
      const start = performance.now();
      const value = await operation.run();
      const ms = performance.now() - start;

      warm_operation_results.push({
        id: operation.id,
        ms: Number(ms.toFixed(3)),
        bytes: Buffer.byteLength(JSON.stringify(value), "utf8"),
      });
    }

    const cold_start = performance.now();
    const cold_service = await CatalogSearchService.create();
    const cold_card = await cold_service.get_component_card("button");
    const cold_card_ms = performance.now() - cold_start;
    const cold_card_bytes = Buffer.byteLength(JSON.stringify(cold_card ?? null), "utf8");
    await cold_service.close();

    const summary = {
      generated_at: new Date().toISOString(),
      mean_precision_at_5:
        results.reduce((total, result) => total + result.precision_at_5, 0) / Math.max(results.length, 1),
      mean_ndcg_at_10:
        results.reduce((total, result) => total + result.ndcg_at_10, 0) / Math.max(results.length, 1),
      mean_first_relevant_rank:
        results
          .map((result) => result.first_relevant_rank)
          .filter((value): value is number => value !== null)
          .reduce((total, value, _, array) => total + value / array.length, 0),
      cold_start_component_card_ms: Number(cold_card_ms.toFixed(3)),
      cold_start_component_card_bytes: cold_card_bytes,
      warm_operation_mean_ms:
        warm_operation_results.reduce((total, result) => total + result.ms, 0) /
        Math.max(warm_operation_results.length, 1),
      warm_operation_mean_bytes:
        warm_operation_results.reduce((total, result) => total + result.bytes, 0) /
        Math.max(warm_operation_results.length, 1),
    };

    const report = { summary, results, warm_operation_results };
    await writeJson(join(paths.benchmarks_dir, "results.json"), report);
    return report;
  } finally {
    await service.close();
  }
};
