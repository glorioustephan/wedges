import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const findUp = (start: string, marker: string) => {
  let current = start;

  while (current !== dirname(current)) {
    const candidate = join(current, marker);
    if (existsSync(candidate)) {
      return current;
    }

    current = dirname(current);
  }

  throw new Error(`Unable to find ${marker} from ${start}`);
};

const here = dirname(fileURLToPath(import.meta.url));
const package_root = findUp(here, "package.json");
const repo_root = findUp(package_root, "pnpm-workspace.yaml");

export const paths = {
  package_root,
  repo_root,
  ui_root: join(repo_root, "packages/ui"),
  docs_root: join(repo_root, "apps/docs"),
  storybook_root: join(repo_root, "apps/storybook"),
  catalog_dir: join(package_root, "catalog"),
  benchmarks_dir: join(package_root, "benchmarks"),
  schema_path: join(package_root, "schemas/catalog.schema.json"),
  database_path: join(package_root, "catalog/tomo-ui.sqlite"),
};

export const toFileHref = (path: string) => pathToFileURL(path).href;
