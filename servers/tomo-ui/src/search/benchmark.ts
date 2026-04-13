import { join } from "node:path";

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
    };

    const report = { summary, results };
    await writeJson(join(paths.benchmarks_dir, "results.json"), report);
    return report;
  } finally {
    await service.close();
  }
};
