import { join } from "node:path";

import { type CatalogArtifacts, type CatalogComponent, type CatalogToken } from "../shared/contracts.js";
import {
  build_component_card,
  classifyStyleFamily,
} from "../shared/build-cards.js";
import { link_component_tokens } from "../shared/catalog-links.js";
import { paths } from "../shared/paths.js";
import { ensureDir, expandLookupValues, fileExists, unique, writeJson } from "../shared/utils.js";
import { load_catalog_artifacts } from "../catalog/catalog.js";
import { SqliteWasmDatabase } from "./sqlite.js";

type BuildReport = {
  generated_at: string;
  record_counts: {
    components: number;
    tokens: number;
    patterns: number;
    categories: number;
    component_tokens: number;
    component_dependencies: number;
    component_variants: number;
    component_props: number;
    component_subcomponents: number;
    component_examples: number;
    component_styles: number;
    component_cards: number;
    component_exact_terms: number;
    token_exact_terms: number;
    pattern_exact_terms: number;
    style_exact_terms: number;
  };
  referential_integrity: {
    invalid_component_categories: string[];
    invalid_pattern_components: string[];
  };
  fts_version: "fts5" | "fts4";
};

const createFtsVirtualTableSql = (
  fts_version: "fts5" | "fts4",
  table_name: string,
  columns: string[]
) => {
  const body = columns.map((column) => `  ${column}`).join(",\n");

  if (fts_version === "fts5") {
    return `CREATE VIRTUAL TABLE ${table_name} USING fts5(
${body},
  tokenize = "unicode61 remove_diacritics 2 tokenchars '-_:/.@[]='",
  prefix = '2 3 4'
);`;
  }

  return `CREATE VIRTUAL TABLE ${table_name} USING fts4(
${body}
);`;
};

type ExactLookupEntry = {
  field_kind: string;
  source_value: string;
  weight: number;
  normalized_values?: string[];
};

const lastLookupSegment = (value: string) => {
  const parts = value
    .split(/[:.]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.at(-1);
};

const createLookupEntries = (entries: ExactLookupEntry[]) => {
  const seen = new Set<string>();

  return entries.flatMap((entry) =>
    unique(entry.normalized_values ?? expandLookupValues(entry.source_value))
      .filter(Boolean)
      .flatMap((normalized_value) => {
        const key = [
          entry.field_kind,
          entry.source_value,
          normalized_value,
          entry.weight,
        ].join("\u0000");

        if (seen.has(key)) {
          return [];
        }

        seen.add(key);
        return [{ ...entry, normalized_value }];
      })
  );
};

const componentLookupEntries = (component: CatalogComponent) =>
  createLookupEntries([
    { field_kind: "component-id", source_value: component.component_id, weight: 140 },
    { field_kind: "name", source_value: component.name, weight: 130 },
    { field_kind: "display-name", source_value: component.display_name, weight: 130 },
    { field_kind: "family", source_value: component.family, weight: 90 },
    ...component.props.flatMap((prop) => [
      { field_kind: "prop", source_value: prop.name, weight: 72 },
      {
        field_kind: "prop",
        source_value: `${component.display_name}.${prop.name}`,
        weight: 98,
      },
      {
        field_kind: "prop",
        source_value: `${component.name}.${prop.name}`,
        weight: 98,
      },
    ]),
    ...component.subcomponents.flatMap((subcomponent) => [
      { field_kind: "subcomponent", source_value: subcomponent.name, weight: 78 },
      { field_kind: "subcomponent-local", source_value: subcomponent.local_name, weight: 72 },
      {
        field_kind: "subcomponent",
        source_value: `${component.display_name}.${subcomponent.name}`,
        weight: 112,
      },
      {
        field_kind: "subcomponent",
        source_value: `${component.name}.${subcomponent.name}`,
        weight: 112,
      },
      ...subcomponent.props.flatMap((prop) => [
        { field_kind: "subcomponent-prop", source_value: prop.name, weight: 72 },
        {
          field_kind: "subcomponent-prop",
          source_value: `${subcomponent.name}.${prop.name}`,
          weight: 118,
        },
        {
          field_kind: "subcomponent-prop",
          source_value: `${component.display_name}.${subcomponent.name}.${prop.name}`,
          weight: 126,
        },
        {
          field_kind: "subcomponent-prop",
          source_value: `${component.name}.${subcomponent.name}.${prop.name}`,
          weight: 126,
        },
      ]),
    ]),
    ...component.token_ids.map((token_id) => ({
      field_kind: "token-id",
      source_value: token_id,
      weight: 80,
    })),
    ...component.utility_classes.map((style_value) => ({
      field_kind: "utility-class",
      source_value: style_value,
      weight: 68,
    })),
    ...component.style_hooks.map((style_value) => ({
      field_kind: "style-hook",
      source_value: style_value,
      weight: 74,
    })),
  ]);

const tokenLookupEntries = (token: CatalogToken) => {
  const leaf_candidates = unique(
    [token.token_id, token.name, token.display_name]
      .map((value) => lastLookupSegment(value))
      .filter(Boolean) as string[]
  );

  return createLookupEntries([
    { field_kind: "token-id", source_value: token.token_id, weight: 140 },
    { field_kind: "name", source_value: token.name, weight: 130 },
    { field_kind: "display-name", source_value: token.display_name, weight: 130 },
    { field_kind: "raw-value", source_value: token.raw_value, weight: 88 },
    ...token.semantic_aliases.map((alias) => ({
      field_kind: "alias",
      source_value: alias,
      weight: 112,
    })),
    ...token.tags.map((tag) => ({
      field_kind: "tag",
      source_value: tag,
      weight: 82,
    })),
    ...leaf_candidates.map((value) => ({
      field_kind: "leaf",
      source_value: value,
      weight: 104,
    })),
  ]);
};

const patternLookupEntries = (pattern: CatalogArtifacts["patterns"][number]) =>
  createLookupEntries([
    { field_kind: "pattern-id", source_value: pattern.pattern_id, weight: 140 },
    { field_kind: "name", source_value: pattern.name, weight: 130 },
    { field_kind: "display-name", source_value: pattern.display_name, weight: 130 },
    ...pattern.tags.map((tag) => ({
      field_kind: "tag",
      source_value: tag,
      weight: 90,
    })),
  ]);

const styleLookupEntries = (
  style_value: string,
  style_kind: string,
  style_family: string,
  token?: CatalogToken
) => {
  const token_leaf_candidates = token
    ? unique(
        [token.token_id, token.name, token.display_name]
          .map((value) => lastLookupSegment(value))
          .filter(Boolean) as string[]
      )
    : [];

  return createLookupEntries([
    { field_kind: "style-value", source_value: style_value, weight: 134 },
    { field_kind: "style-kind", source_value: style_kind, weight: 72 },
    { field_kind: "style-family", source_value: style_family, weight: 72 },
    ...(token
      ? [
          { field_kind: "token-id", source_value: token.token_id, weight: 128 },
          { field_kind: "token-name", source_value: token.name, weight: 116 },
          { field_kind: "token-display-name", source_value: token.display_name, weight: 116 },
          { field_kind: "token-raw-value", source_value: token.raw_value, weight: 82 },
          ...token.semantic_aliases.map((alias) => ({
            field_kind: "token-alias",
            source_value: alias,
            weight: 108,
          })),
          ...token_leaf_candidates.map((value) => ({
            field_kind: "token-leaf",
            source_value: value,
            weight: 110,
          })),
        ]
      : []),
  ]);
};

const createBaseSchema = (fts_version: "fts5" | "fts4") => `
PRAGMA foreign_keys = ON;
DROP TABLE IF EXISTS metadata;
DROP TABLE IF EXISTS component_styles;
DROP TABLE IF EXISTS style_exact_lookup;
DROP TABLE IF EXISTS pattern_exact_lookup;
DROP TABLE IF EXISTS token_exact_lookup;
DROP TABLE IF EXISTS component_exact_lookup;
DROP TABLE IF EXISTS component_cards;
DROP TABLE IF EXISTS component_examples;
DROP TABLE IF EXISTS component_subcomponents;
DROP TABLE IF EXISTS component_props;
DROP TABLE IF EXISTS component_tokens;
DROP TABLE IF EXISTS component_variants;
DROP TABLE IF EXISTS component_dependencies;
DROP TABLE IF EXISTS component_tags;
DROP TABLE IF EXISTS component_categories;
DROP TABLE IF EXISTS pattern_components;
DROP TABLE IF EXISTS components;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS patterns;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS components_fts;
DROP TABLE IF EXISTS component_api_fts;
DROP TABLE IF EXISTS component_examples_fts;
DROP TABLE IF EXISTS component_styles_fts;
DROP TABLE IF EXISTS tokens_fts;
DROP TABLE IF EXISTS patterns_fts;

CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE categories (
  category_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags_json TEXT NOT NULL
);

CREATE TABLE patterns (
  pattern_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(category_id),
  tags_json TEXT NOT NULL,
  component_ids_json TEXT NOT NULL,
  search_text TEXT NOT NULL
);

CREATE TABLE components (
  component_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  framework TEXT NOT NULL,
  status TEXT NOT NULL,
  family TEXT NOT NULL,
  source_path TEXT NOT NULL,
  description TEXT NOT NULL,
  summary TEXT NOT NULL,
  category_ids_json TEXT NOT NULL,
  pattern_ids_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  intent_labels_json TEXT NOT NULL,
  slots_json TEXT NOT NULL,
  props_json TEXT NOT NULL,
  variants_json TEXT NOT NULL,
  accessibility_json TEXT NOT NULL,
  dependencies_json TEXT NOT NULL,
  utility_classes_json TEXT NOT NULL,
  style_hooks_json TEXT NOT NULL,
  subcomponents_json TEXT NOT NULL,
  examples_json TEXT NOT NULL,
  token_ids_json TEXT NOT NULL,
  supported_themes_json TEXT NOT NULL,
  search_text TEXT NOT NULL
);

CREATE TABLE tokens (
  token_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL,
  raw_value TEXT NOT NULL,
  semantic_aliases_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  source_path TEXT NOT NULL,
  description TEXT NOT NULL,
  modes_json TEXT NOT NULL,
  search_text TEXT NOT NULL
);

CREATE TABLE component_categories (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  category_id TEXT NOT NULL REFERENCES categories(category_id),
  PRIMARY KEY (component_id, category_id)
);

CREATE TABLE pattern_components (
  pattern_id TEXT NOT NULL REFERENCES patterns(pattern_id),
  component_id TEXT NOT NULL REFERENCES components(component_id),
  PRIMARY KEY (pattern_id, component_id)
);

CREATE TABLE component_tags (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  tag TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (component_id, tag, source)
);

CREATE TABLE component_dependencies (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  dependency_name TEXT NOT NULL,
  dependency_kind TEXT NOT NULL,
  imported_symbols_json TEXT NOT NULL,
  PRIMARY KEY (component_id, dependency_name)
);

CREATE TABLE component_variants (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  variant_name TEXT NOT NULL,
  variant_values_json TEXT NOT NULL,
  variant_source TEXT NOT NULL,
  PRIMARY KEY (component_id, variant_name)
);

CREATE TABLE component_tokens (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  token_id TEXT NOT NULL REFERENCES tokens(token_id),
  relation TEXT NOT NULL,
  PRIMARY KEY (component_id, token_id)
);

CREATE TABLE component_props (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  owner_name TEXT NOT NULL,
  prop_name TEXT NOT NULL,
  prop_type TEXT NOT NULL,
  required INTEGER NOT NULL,
  default_value TEXT,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (component_id, owner_name, prop_name, source)
);

CREATE TABLE component_subcomponents (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  subcomponent_name TEXT NOT NULL,
  local_name TEXT NOT NULL,
  props_json TEXT NOT NULL,
  PRIMARY KEY (component_id, subcomponent_name)
);

CREATE TABLE component_examples (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  example_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  source TEXT NOT NULL,
  code TEXT NOT NULL,
  PRIMARY KEY (component_id, example_id)
);

CREATE TABLE component_styles (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  style_value TEXT NOT NULL,
  style_kind TEXT NOT NULL,
  style_family TEXT NOT NULL,
  token_id TEXT REFERENCES tokens(token_id),
  PRIMARY KEY (component_id, style_value, style_kind)
);

CREATE TABLE component_cards (
  component_id TEXT PRIMARY KEY REFERENCES components(component_id),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  framework TEXT NOT NULL,
  status TEXT NOT NULL,
  family TEXT NOT NULL,
  source_path TEXT NOT NULL,
  summary TEXT NOT NULL,
  guidance TEXT NOT NULL,
  primary_props_json TEXT NOT NULL,
  variant_groups_json TEXT NOT NULL,
  composition_order_json TEXT NOT NULL,
  subcomponents_json TEXT NOT NULL,
  examples_json TEXT NOT NULL,
  accessibility_notes_json TEXT NOT NULL,
  token_ids_json TEXT NOT NULL,
  linked_tokens_json TEXT NOT NULL,
  style_signals_json TEXT NOT NULL,
  category_ids_json TEXT NOT NULL,
  pattern_ids_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  intent_labels_json TEXT NOT NULL,
  supported_themes_json TEXT NOT NULL,
  search_text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  confidence REAL NOT NULL
);

CREATE TABLE component_exact_lookup (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  field_kind TEXT NOT NULL,
  source_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  weight INTEGER NOT NULL,
  PRIMARY KEY (component_id, field_kind, source_value, normalized_value)
);

CREATE TABLE token_exact_lookup (
  token_id TEXT NOT NULL REFERENCES tokens(token_id),
  field_kind TEXT NOT NULL,
  source_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  weight INTEGER NOT NULL,
  PRIMARY KEY (token_id, field_kind, source_value, normalized_value)
);

CREATE TABLE pattern_exact_lookup (
  pattern_id TEXT NOT NULL REFERENCES patterns(pattern_id),
  field_kind TEXT NOT NULL,
  source_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  weight INTEGER NOT NULL,
  PRIMARY KEY (pattern_id, field_kind, source_value, normalized_value)
);

CREATE TABLE style_exact_lookup (
  component_id TEXT NOT NULL REFERENCES components(component_id),
  style_value TEXT NOT NULL,
  style_kind TEXT NOT NULL,
  style_family TEXT NOT NULL,
  token_id TEXT REFERENCES tokens(token_id),
  field_kind TEXT NOT NULL,
  source_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  weight INTEGER NOT NULL,
  PRIMARY KEY (component_id, style_value, style_kind, field_kind, source_value, normalized_value)
);

CREATE INDEX component_exact_lookup_value_idx
  ON component_exact_lookup(normalized_value, weight DESC, component_id);

CREATE INDEX token_exact_lookup_value_idx
  ON token_exact_lookup(normalized_value, weight DESC, token_id);

CREATE INDEX pattern_exact_lookup_value_idx
  ON pattern_exact_lookup(normalized_value, weight DESC, pattern_id);

CREATE INDEX style_exact_lookup_value_idx
  ON style_exact_lookup(normalized_value, weight DESC, component_id, style_kind);

${createFtsVirtualTableSql(fts_version, "components_fts", [
  "component_id",
  "name",
  "display_name",
  "category_ids",
  "pattern_ids",
  "tags",
  "props",
  "variants",
  "subcomponents",
  "dependencies",
  "tokens",
  "description",
  "summary",
  "search_text",
])}

${createFtsVirtualTableSql(fts_version, "component_api_fts", [
  "component_id",
  "owner_name",
  "entry_kind",
  "entry_name",
  "description",
  "search_text",
])}

${createFtsVirtualTableSql(fts_version, "component_examples_fts", [
  "component_id",
  "example_id",
  "title",
  "file_path",
  "source",
  "code",
  "search_text",
])}

${createFtsVirtualTableSql(fts_version, "component_styles_fts", [
  "component_id",
  "style_kind",
  "style_family",
  "style_value",
  "token_id",
  "search_text",
])}

${createFtsVirtualTableSql(fts_version, "tokens_fts", [
  "token_id",
  "name",
  "display_name",
  "kind",
  "aliases",
  "description",
  "search_text",
])}

${createFtsVirtualTableSql(fts_version, "patterns_fts", [
  "pattern_id",
  "name",
  "display_name",
  "category_id",
  "tags",
  "description",
  "search_text",
])}
`;

const validateArtifacts = (artifacts: CatalogArtifacts) => {
  const category_ids = new Set(artifacts.categories.map((category) => category.category_id));
  const component_ids = new Set(artifacts.components.map((component) => component.component_id));

  return {
    invalid_component_categories: artifacts.components.flatMap((component) =>
      component.category_ids
        .filter((category_id) => !category_ids.has(category_id))
        .map((category_id) => `${component.component_id}:${category_id}`)
    ),
    invalid_pattern_components: artifacts.patterns.flatMap((pattern) =>
      pattern.component_ids
        .filter((component_id) => !component_ids.has(component_id))
        .map((component_id) => `${pattern.pattern_id}:${component_id}`)
    ),
  };
};

const createSchema = (database: SqliteWasmDatabase) => {
  try {
    database.exec(createBaseSchema("fts5"));
    return "fts5" as const;
  } catch {
    database.exec(createBaseSchema("fts4"));
    return "fts4" as const;
  }
};

const bm25Sql = (fts_version: "fts5" | "fts4", table: string, weights?: number[]) => {
  if (fts_version !== "fts5") {
    return "0";
  }

  if (!weights || weights.length === 0) {
    return `bm25(${table})`;
  }

  return `bm25(${table}, ${weights.join(", ")})`;
};

const runtimeSchemaVersion = "2";

const isCurrentRuntimeDatabase = async () => {
  if (!(await fileExists(paths.database_path))) {
    return false;
  }

  try {
    const database = await SqliteWasmDatabase.open_from_file(paths.database_path);

    try {
      const schema_version = database.value<string>(
        "SELECT value FROM metadata WHERE key = 'schema_version'"
      );
      return schema_version === runtimeSchemaVersion;
    } finally {
      await database.close();
    }
  } catch {
    return false;
  }
};

export const build_database_from_artifacts = async (artifacts?: CatalogArtifacts) => {
  const catalog = artifacts ?? (await load_catalog_artifacts());
  await ensureDir(paths.catalog_dir);

  const database = await SqliteWasmDatabase.open_from_bytes();
  const fts_version = createSchema(database);
  const token_links = link_component_tokens(catalog.components, catalog.tokens);
  const integrity = validateArtifacts(catalog);
  const token_map = new Map(catalog.tokens.map((token) => [token.token_id, token] as const));
  const component_cards = catalog.components.map((component) => build_component_card(component, token_map));
  let component_exact_terms = 0;
  let token_exact_terms = 0;
  let pattern_exact_terms = 0;
  let style_exact_terms = 0;

  database.run("INSERT INTO metadata(key, value) VALUES (?, ?)", ["fts_version", fts_version]);
  database.run("INSERT INTO metadata(key, value) VALUES (?, ?)", ["schema_version", "2"]);
  database.run("INSERT INTO metadata(key, value) VALUES (?, ?)", [
    "catalog_manifest",
    JSON.stringify(catalog.manifest),
  ]);

  catalog.categories.forEach((category) => {
    database.run(
      "INSERT INTO categories(category_id, name, display_name, description, tags_json) VALUES (?, ?, ?, ?, ?)",
      [
        category.category_id,
        category.name,
        category.display_name,
        category.description,
        JSON.stringify(category.tags),
      ]
    );
  });

  catalog.patterns.forEach((pattern) => {
    database.run(
      "INSERT INTO patterns(pattern_id, name, display_name, description, category_id, tags_json, component_ids_json, search_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        pattern.pattern_id,
        pattern.name,
        pattern.display_name,
        pattern.description,
        pattern.category_id,
        JSON.stringify(pattern.tags),
        JSON.stringify(pattern.component_ids),
        pattern.search_text,
      ]
    );

    patternLookupEntries(pattern).forEach((entry) => {
      database.run(
        "INSERT INTO pattern_exact_lookup(pattern_id, field_kind, source_value, normalized_value, weight) VALUES (?, ?, ?, ?, ?)",
        [pattern.pattern_id, entry.field_kind, entry.source_value, entry.normalized_value, entry.weight]
      );
      pattern_exact_terms += 1;
    });
  });

  catalog.components.forEach((component) => {
    database.run(
      "INSERT INTO components(component_id, name, display_name, framework, status, family, source_path, description, summary, category_ids_json, pattern_ids_json, tags_json, intent_labels_json, slots_json, props_json, variants_json, accessibility_json, dependencies_json, utility_classes_json, style_hooks_json, subcomponents_json, examples_json, token_ids_json, supported_themes_json, search_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        component.component_id,
        component.name,
        component.display_name,
        component.framework,
        component.status,
        component.family,
        component.source_path,
        component.description,
        component.summary,
        JSON.stringify(component.category_ids),
        JSON.stringify(component.pattern_ids),
        JSON.stringify(component.tags),
        JSON.stringify(component.intent_labels),
        JSON.stringify(component.slots),
        JSON.stringify(component.props),
        JSON.stringify(component.variants),
        JSON.stringify(component.accessibility),
        JSON.stringify(component.dependencies),
        JSON.stringify(component.utility_classes),
        JSON.stringify(component.style_hooks),
        JSON.stringify(component.subcomponents),
        JSON.stringify(component.examples),
        JSON.stringify(component.token_ids),
        JSON.stringify(component.supported_themes),
        component.search_text,
      ]
    );

    componentLookupEntries(component).forEach((entry) => {
      database.run(
        "INSERT INTO component_exact_lookup(component_id, field_kind, source_value, normalized_value, weight) VALUES (?, ?, ?, ?, ?)",
        [component.component_id, entry.field_kind, entry.source_value, entry.normalized_value, entry.weight]
      );
      component_exact_terms += 1;
    });

    component.category_ids.forEach((category_id) => {
      database.run(
        "INSERT INTO component_categories(component_id, category_id) VALUES (?, ?)",
        [component.component_id, category_id]
      );
    });

    component.tags.forEach((tag) => {
      database.run("INSERT INTO component_tags(component_id, tag, source) VALUES (?, ?, ?)", [
        component.component_id,
        tag,
        "tag",
      ]);
    });

    component.intent_labels.forEach((tag) => {
      database.run("INSERT INTO component_tags(component_id, tag, source) VALUES (?, ?, ?)", [
        component.component_id,
        tag,
        "intent",
      ]);
    });

    component.dependencies.forEach((dependency) => {
      database.run(
        "INSERT INTO component_dependencies(component_id, dependency_name, dependency_kind, imported_symbols_json) VALUES (?, ?, ?, ?)",
        [
          component.component_id,
          dependency.name,
          dependency.kind,
          JSON.stringify(dependency.imported_symbols),
        ]
      );
    });

    component.variants.forEach((variant) => {
      database.run(
        "INSERT INTO component_variants(component_id, variant_name, variant_values_json, variant_source) VALUES (?, ?, ?, ?)",
        [
          component.component_id,
          variant.name,
          JSON.stringify(variant.values),
          variant.source,
        ]
      );
    });

    component.props.forEach((prop) => {
      database.run(
        "INSERT INTO component_props(component_id, owner_name, prop_name, prop_type, required, default_value, description, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          component.component_id,
          component.display_name,
          prop.name,
          prop.type,
          prop.required ? 1 : 0,
          prop.default_value ?? null,
          prop.description ?? "",
          prop.source,
        ]
      );
      database.run(
        "INSERT INTO component_api_fts(component_id, owner_name, entry_kind, entry_name, description, search_text) VALUES (?, ?, ?, ?, ?, ?)",
        [
          component.component_id,
          component.display_name,
          "prop",
          prop.name,
          prop.description ?? "",
          [
            component.display_name,
            component.name,
            prop.name,
            prop.type,
            prop.description ?? "",
            prop.default_value ?? "",
            component.summary,
          ]
            .filter(Boolean)
            .join(" "),
        ]
      );
    });

    component.subcomponents.forEach((subcomponent) => {
      const owner_name = `${component.display_name}.${subcomponent.name}`;

      database.run(
        "INSERT INTO component_subcomponents(component_id, subcomponent_name, local_name, props_json) VALUES (?, ?, ?, ?)",
        [
          component.component_id,
          subcomponent.name,
          subcomponent.local_name,
          JSON.stringify(subcomponent.props),
        ]
      );
      database.run(
        "INSERT INTO component_api_fts(component_id, owner_name, entry_kind, entry_name, description, search_text) VALUES (?, ?, ?, ?, ?, ?)",
        [
          component.component_id,
          owner_name,
          "subcomponent",
          subcomponent.name,
          `Compound API entry for ${owner_name}.`,
          [
            component.display_name,
            component.name,
            subcomponent.name,
            subcomponent.local_name,
            ...subcomponent.props.flatMap((prop) => [prop.name, prop.type, prop.description ?? ""]),
          ]
            .filter(Boolean)
            .join(" "),
        ]
      );

      subcomponent.props.forEach((prop) => {
        database.run(
          "INSERT INTO component_props(component_id, owner_name, prop_name, prop_type, required, default_value, description, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            component.component_id,
            owner_name,
            prop.name,
            prop.type,
            prop.required ? 1 : 0,
            prop.default_value ?? null,
            prop.description ?? "",
            prop.source,
          ]
        );
        database.run(
          "INSERT INTO component_api_fts(component_id, owner_name, entry_kind, entry_name, description, search_text) VALUES (?, ?, ?, ?, ?, ?)",
          [
            component.component_id,
            owner_name,
            "subcomponent-prop",
            prop.name,
            prop.description ?? "",
            [
              component.display_name,
              component.name,
              owner_name,
              prop.name,
              prop.type,
              prop.description ?? "",
              prop.default_value ?? "",
            ]
              .filter(Boolean)
              .join(" "),
          ]
        );
      });
    });

    component.examples.forEach((example) => {
      database.run(
        "INSERT INTO component_examples(component_id, example_id, title, file_path, source, code) VALUES (?, ?, ?, ?, ?, ?)",
        [
          component.component_id,
          example.id,
          example.title,
          example.file_path,
          example.source,
          example.code,
        ]
      );
      database.run(
        "INSERT INTO component_examples_fts(component_id, example_id, title, file_path, source, code, search_text) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          component.component_id,
          example.id,
          example.title,
          example.file_path,
          example.source,
          example.code,
          [component.display_name, component.name, example.title, example.file_path, example.source]
            .filter(Boolean)
            .join(" "),
        ]
      );
    });

    component.utility_classes.forEach((style_value) => {
      const style_family = classifyStyleFamily(style_value, "utility-class");

      database.run(
        "INSERT INTO component_styles(component_id, style_value, style_kind, style_family, token_id) VALUES (?, ?, ?, ?, ?)",
        [
          component.component_id,
          style_value,
          "utility-class",
          style_family,
          null,
        ]
      );
      database.run(
        "INSERT INTO component_styles_fts(component_id, style_kind, style_family, style_value, token_id, search_text) VALUES (?, ?, ?, ?, ?, ?)",
        [
          component.component_id,
          "utility-class",
          style_family,
          style_value,
          "",
          [component.display_name, component.name, style_value, component.summary].filter(Boolean).join(" "),
        ]
      );

      styleLookupEntries(style_value, "utility-class", style_family).forEach((entry) => {
        database.run(
          "INSERT INTO style_exact_lookup(component_id, style_value, style_kind, style_family, token_id, field_kind, source_value, normalized_value, weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            component.component_id,
            style_value,
            "utility-class",
            style_family,
            null,
            entry.field_kind,
            entry.source_value,
            entry.normalized_value,
            entry.weight,
          ]
        );
        style_exact_terms += 1;
      });
    });

    component.style_hooks.forEach((style_value) => {
      const style_family = classifyStyleFamily(style_value, "style-hook");

      database.run(
        "INSERT INTO component_styles(component_id, style_value, style_kind, style_family, token_id) VALUES (?, ?, ?, ?, ?)",
        [
          component.component_id,
          style_value,
          "style-hook",
          style_family,
          null,
        ]
      );
      database.run(
        "INSERT INTO component_styles_fts(component_id, style_kind, style_family, style_value, token_id, search_text) VALUES (?, ?, ?, ?, ?, ?)",
        [
          component.component_id,
          "style-hook",
          style_family,
          style_value,
          "",
          [component.display_name, component.name, style_value, component.summary].filter(Boolean).join(" "),
        ]
      );

      styleLookupEntries(style_value, "style-hook", style_family).forEach((entry) => {
        database.run(
          "INSERT INTO style_exact_lookup(component_id, style_value, style_kind, style_family, token_id, field_kind, source_value, normalized_value, weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            component.component_id,
            style_value,
            "style-hook",
            style_family,
            null,
            entry.field_kind,
            entry.source_value,
            entry.normalized_value,
            entry.weight,
          ]
        );
        style_exact_terms += 1;
      });
    });

  });

  component_cards.forEach((card) => {
    database.run(
      "INSERT INTO component_cards(component_id, name, display_name, framework, status, family, source_path, summary, guidance, primary_props_json, variant_groups_json, composition_order_json, subcomponents_json, examples_json, accessibility_notes_json, token_ids_json, linked_tokens_json, style_signals_json, category_ids_json, pattern_ids_json, tags_json, intent_labels_json, supported_themes_json, search_text, rationale, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        card.component_id,
        card.name,
        card.display_name,
        card.framework,
        card.status,
        card.family,
        card.source_path,
        card.summary,
        card.guidance,
        JSON.stringify(card.primary_props),
        JSON.stringify(card.variant_groups),
        JSON.stringify(card.composition_order),
        JSON.stringify(card.subcomponents),
        JSON.stringify(card.examples),
        JSON.stringify(card.accessibility_notes),
        JSON.stringify(card.token_ids),
        JSON.stringify(card.linked_tokens),
        JSON.stringify(card.style_signals),
        JSON.stringify(card.category_ids),
        JSON.stringify(card.pattern_ids),
        JSON.stringify(card.tags),
        JSON.stringify(card.intent_labels),
        JSON.stringify(card.supported_themes),
        card.search_text,
        card.rationale,
        card.confidence,
      ]
    );
  });

  catalog.tokens.forEach((token) => {
    database.run(
      "INSERT INTO tokens(token_id, name, display_name, kind, raw_value, semantic_aliases_json, tags_json, source_path, description, modes_json, search_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        token.token_id,
        token.name,
        token.display_name,
        token.kind,
        token.raw_value,
        JSON.stringify(token.semantic_aliases),
        JSON.stringify(token.tags),
        token.source_path,
        token.description,
        JSON.stringify(token.modes),
        token.search_text,
      ]
    );

    tokenLookupEntries(token).forEach((entry) => {
      database.run(
        "INSERT INTO token_exact_lookup(token_id, field_kind, source_value, normalized_value, weight) VALUES (?, ?, ?, ?, ?)",
        [token.token_id, entry.field_kind, entry.source_value, entry.normalized_value, entry.weight]
      );
      token_exact_terms += 1;
    });
  });

  catalog.components.forEach((component) => {
    const component_token_lookup_seen = new Set<string>();

    component.token_ids.forEach((token_id) => {
      const token = token_map.get(token_id);

      if (!token) {
        return;
      }

      const style_family = classifyStyleFamily(token.kind, "design-token");

      database.run(
        "INSERT INTO component_styles(component_id, style_value, style_kind, style_family, token_id) VALUES (?, ?, ?, ?, ?)",
        [component.component_id, token.display_name, "design-token", style_family, token_id]
      );
      database.run(
        "INSERT INTO component_styles_fts(component_id, style_kind, style_family, style_value, token_id, search_text) VALUES (?, ?, ?, ?, ?, ?)",
        [
          component.component_id,
          "design-token",
          style_family,
          token.display_name,
          token_id,
          [
            component.display_name,
            component.name,
            token.display_name,
            token.name,
            token.raw_value,
            ...token.semantic_aliases,
            ...token.tags,
          ]
            .filter(Boolean)
            .join(" "),
        ]
      );

      styleLookupEntries(token.display_name, "design-token", style_family, token).forEach((entry) => {
        database.run(
          "INSERT INTO style_exact_lookup(component_id, style_value, style_kind, style_family, token_id, field_kind, source_value, normalized_value, weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            component.component_id,
            token.display_name,
            "design-token",
            style_family,
            token_id,
            entry.field_kind,
            entry.source_value,
            entry.normalized_value,
            entry.weight,
          ]
        );
        style_exact_terms += 1;
      });

      createLookupEntries([
        { field_kind: "token-name", source_value: token.name, weight: 88 },
        { field_kind: "token-display-name", source_value: token.display_name, weight: 88 },
        ...token.semantic_aliases.map((alias) => ({
          field_kind: "token-alias",
          source_value: alias,
          weight: 84,
        })),
      ]).forEach((entry) => {
        const key = [entry.field_kind, entry.source_value, entry.normalized_value].join("\u0000");

        if (component_token_lookup_seen.has(key)) {
          return;
        }

        component_token_lookup_seen.add(key);
        database.run(
          "INSERT INTO component_exact_lookup(component_id, field_kind, source_value, normalized_value, weight) VALUES (?, ?, ?, ?, ?)",
          [component.component_id, entry.field_kind, entry.source_value, entry.normalized_value, entry.weight]
        );
        component_exact_terms += 1;
      });
    });
  });

  token_links.forEach((link) => {
    database.run(
      "INSERT INTO component_tokens(component_id, token_id, relation) VALUES (?, ?, ?)",
      [link.component_id, link.token_id, link.relation]
    );
  });

  catalog.patterns.forEach((pattern) => {
    pattern.component_ids.forEach((component_id) => {
      database.run(
        "INSERT INTO pattern_components(pattern_id, component_id) VALUES (?, ?)",
        [pattern.pattern_id, component_id]
      );
    });
  });

  catalog.components.forEach((component) => {
    database.run(
      `INSERT INTO components_fts(component_id, name, display_name, category_ids, pattern_ids, tags, props, variants, subcomponents, dependencies, tokens, description, summary, search_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        component.component_id,
        component.name,
        component.display_name,
        component.category_ids.join(" "),
        component.pattern_ids.join(" "),
        [...component.tags, ...component.intent_labels].join(" "),
        component.props.map((prop) => `${prop.name} ${prop.type} ${prop.description ?? ""}`).join(" "),
        component.variants.map((variant) => `${variant.name} ${variant.values.join(" ")}`).join(" "),
        component.subcomponents
          .map((subcomponent) =>
            [subcomponent.name, subcomponent.local_name, ...subcomponent.props.map((prop) => prop.name)].join(" ")
          )
          .join(" "),
        component.dependencies.map((dependency) => dependency.name).join(" "),
        component.token_ids.join(" "),
        component.description,
        component.summary,
        component.search_text,
      ]
    );
  });

  catalog.tokens.forEach((token) => {
    database.run(
      "INSERT INTO tokens_fts(token_id, name, display_name, kind, aliases, description, search_text) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        token.token_id,
        token.name,
        token.display_name,
        token.kind,
        token.semantic_aliases.join(" "),
        token.description,
        token.search_text,
      ]
    );
  });

  catalog.patterns.forEach((pattern) => {
    database.run(
      "INSERT INTO patterns_fts(pattern_id, name, display_name, category_id, tags, description, search_text) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        pattern.pattern_id,
        pattern.name,
        pattern.display_name,
        pattern.category_id,
        pattern.tags.join(" "),
        pattern.description,
        pattern.search_text,
      ]
    );
  });

  await database.save(paths.database_path);
  await database.close();
  await writeJson(join(paths.catalog_dir, "build-cards.json"), component_cards);

  const report: BuildReport = {
    generated_at: new Date().toISOString(),
    record_counts: {
      components: catalog.components.length,
      tokens: catalog.tokens.length,
      patterns: catalog.patterns.length,
      categories: catalog.categories.length,
      component_tokens: token_links.length,
      component_dependencies: catalog.components.reduce(
        (total, component) => total + component.dependencies.length,
        0
      ),
      component_variants: catalog.components.reduce((total, component) => total + component.variants.length, 0),
      component_props: catalog.components.reduce(
        (total, component) =>
          total +
          component.props.length +
          component.subcomponents.reduce((sub_total, subcomponent) => sub_total + subcomponent.props.length, 0),
        0
      ),
      component_subcomponents: catalog.components.reduce(
        (total, component) => total + component.subcomponents.length,
        0
      ),
      component_examples: catalog.components.reduce((total, component) => total + component.examples.length, 0),
      component_styles: catalog.components.reduce(
        (total, component) =>
          total + component.utility_classes.length + component.style_hooks.length + component.token_ids.length,
        0
      ),
      component_cards: component_cards.length,
      component_exact_terms,
      token_exact_terms,
      pattern_exact_terms,
      style_exact_terms,
    },
    referential_integrity: integrity,
    fts_version,
  };

  await writeJson(join(paths.catalog_dir, "build-report.json"), report);

  return report;
};

export const ensure_runtime_database = async () => {
  if (await isCurrentRuntimeDatabase()) {
    return;
  }

  if (!(await fileExists(join(paths.catalog_dir, "components.json")))) {
    throw new Error(
      "catalog/tomo-ui.sqlite is missing and no catalog artifacts were found. Run `pnpm --filter @wedges/tomo-ui rebuild` first."
    );
  }

  await build_database_from_artifacts();
};

export const open_runtime_database = async () => {
  await ensure_runtime_database();
  return SqliteWasmDatabase.open_from_file(paths.database_path);
};

export const ftsScoreSql = bm25Sql;
