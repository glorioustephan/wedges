import { build_database_from_artifacts } from "./db/build-db.js";
import { parse_catalog_artifacts, write_catalog_artifacts } from "./catalog/catalog.js";
import { runBenchmarks } from "./search/benchmark.js";

const usage = `Usage: ui-builder <parse-catalog|build-db|rebuild|benchmark>\n`;

const writeStdout = (value: string) => {
  process.stdout.write(`${value}\n`);
};

const writeStderr = (value: string) => {
  process.stderr.write(`${value}\n`);
};

const main = async () => {
  const command = process.argv[2];

  if (!command) {
    writeStderr(usage.trimEnd());
    process.exitCode = 1;
    return;
  }

  if (command === "parse-catalog") {
    const artifacts = await parse_catalog_artifacts();
    await write_catalog_artifacts(artifacts);
    writeStdout(
      `Wrote catalog artifacts: ${artifacts.manifest.counts.components} components, ${artifacts.manifest.counts.tokens} tokens.`
    );
    return;
  }

  if (command === "build-db") {
    const report = await build_database_from_artifacts();
    writeStdout(
      `Built ui-builder.sqlite with ${report.record_counts.components} components and ${report.record_counts.tokens} tokens using ${report.fts_version}.`
    );
    return;
  }

  if (command === "rebuild") {
    const artifacts = await parse_catalog_artifacts();
    await write_catalog_artifacts(artifacts);
    const report = await build_database_from_artifacts(artifacts);
    writeStdout(
      `Rebuilt catalog and database: ${report.record_counts.components} components, ${report.record_counts.tokens} tokens, ${report.record_counts.patterns} patterns.`
    );
    return;
  }

  if (command === "benchmark") {
    const report = await runBenchmarks();
    writeStdout(
      `Benchmarks complete. precision@5=${report.summary.mean_precision_at_5.toFixed(3)} nDCG@10=${report.summary.mean_ndcg_at_10.toFixed(3)} warm_ms=${report.summary.warm_operation_mean_ms.toFixed(3)} cold_card_ms=${report.summary.cold_start_component_card_ms.toFixed(3)}`
    );
    return;
  }

  writeStderr(usage.trimEnd());
  process.exitCode = 1;
};

main().catch((error) => {
  writeStderr(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
