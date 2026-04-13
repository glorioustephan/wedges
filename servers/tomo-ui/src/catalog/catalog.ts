import matter from "gray-matter";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  type CatalogArtifacts,
  catalog_artifacts_schema,
  type CatalogComponent,
  type CatalogManifest,
  type CatalogPattern,
  type CatalogProp,
  type CatalogSubcomponent,
  type CatalogToken,
  type CatalogVariant,
} from "../shared/contracts.js";
import { link_component_tokens } from "../shared/catalog-links.js";
import { paths, toFileHref } from "../shared/paths.js";
import {
  chunkText,
  compareStrings,
  ensureDir,
  fileExists,
  listFiles,
  normalizeQueryTokens,
  readText,
  repoRelative,
  safeEval,
  sentence,
  slugify,
  sorted,
  titleFromSlug,
  unique,
  writeJson,
} from "../shared/utils.js";
import {
  build_patterns,
  classify_dependency,
  get_categories,
  get_component_taxonomy,
  get_theme_aliases,
} from "./taxonomy.js";

type ComponentSource = {
  component_name: string;
  slug: string;
  source_path: string;
  variants_path?: string;
  index_path: string;
};

type DocsMetadata = {
  title: string;
  description: string;
  source_path?: string;
  props: CatalogProp[];
  example_names: string[];
};

type StoryMetadata = {
  props: CatalogProp[];
  variants: CatalogVariant[];
  examples: { id: string; title: string; file_path: string; code: string }[];
};

const extractBalancedSegment = (
  source: string,
  open_index: number,
  opener: string,
  closer: string
) => {
  let depth = 0;
  let in_string: string | null = null;
  let in_line_comment = false;
  let in_block_comment = false;

  for (let index = open_index; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    const prev = source[index - 1];

    if (in_line_comment) {
      if (char === "\n") {
        in_line_comment = false;
      }
      continue;
    }

    if (in_block_comment) {
      if (prev === "*" && char === "/") {
        in_block_comment = false;
      }
      continue;
    }

    if (in_string) {
      if (char === in_string && prev !== "\\") {
        in_string = null;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      in_line_comment = true;
      continue;
    }

    if (char === "/" && next === "*") {
      in_block_comment = true;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      in_string = char;
      continue;
    }

    if (char === opener) {
      depth += 1;
    } else if (char === closer) {
      depth -= 1;

      if (depth === 0) {
        return source.slice(open_index, index + 1);
      }
    }
  }

  return undefined;
};

const extractAttributeExpression = (source: string, marker: string) => {
  const marker_index = source.indexOf(marker);

  if (marker_index === -1) {
    return undefined;
  }

  const open_index = source.indexOf("{", marker_index + marker.length);

  if (open_index === -1) {
    return undefined;
  }

  const segment = extractBalancedSegment(source, open_index, "{", "}");
  return segment ? segment.slice(1, -1).trim() : undefined;
};

const extractObjectLiteral = (source: string, marker: string) => {
  const marker_index = source.indexOf(marker);

  if (marker_index === -1) {
    return undefined;
  }

  const open_index = source.indexOf("{", marker_index + marker.length);

  if (open_index === -1) {
    return undefined;
  }

  return extractBalancedSegment(source, open_index, "{", "}");
};

const normalizeGithubPath = (source_url?: string) => {
  if (!source_url) {
    return undefined;
  }

  const blob_index = source_url.indexOf("/blob/main/");
  const tree_index = source_url.indexOf("/tree/main/");

  if (blob_index >= 0) {
    return source_url.slice(blob_index + "/blob/main/".length);
  }

  if (tree_index >= 0) {
    return source_url.slice(tree_index + "/tree/main/".length);
  }

  return undefined;
};

const collectStringLiterals = (source: string) => {
  const values: string[] = [];
  let in_string: string | null = null;
  let in_line_comment = false;
  let in_block_comment = false;
  let current = "";

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    const prev = source[index - 1];

    if (in_line_comment) {
      if (char === "\n") {
        in_line_comment = false;
      }
      continue;
    }

    if (in_block_comment) {
      if (prev === "*" && char === "/") {
        in_block_comment = false;
      }
      continue;
    }

    if (in_string) {
      if (char === "\\" && next) {
        current += char;
        current += next;
        index += 1;
        continue;
      }

      if (char === in_string) {
        values.push(current);
        current = "";
        in_string = null;
        continue;
      }

      current += char;
      continue;
    }

    if (char === "/" && next === "/") {
      in_line_comment = true;
      continue;
    }

    if (char === "/" && next === "*") {
      in_block_comment = true;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      in_string = char;
      current = "";
    }
  }

  return values;
};

const splitTopLevel = (value: string, delimiter: string) => {
  const parts: string[] = [];
  let depth_angle = 0;
  let depth_brace = 0;
  let depth_bracket = 0;
  let depth_paren = 0;
  let current = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === "<") {
      depth_angle += 1;
    } else if (char === ">") {
      depth_angle = Math.max(0, depth_angle - 1);
    } else if (char === "{") {
      depth_brace += 1;
    } else if (char === "}") {
      depth_brace = Math.max(0, depth_brace - 1);
    } else if (char === "[") {
      depth_bracket += 1;
    } else if (char === "]") {
      depth_bracket = Math.max(0, depth_bracket - 1);
    } else if (char === "(") {
      depth_paren += 1;
    } else if (char === ")") {
      depth_paren = Math.max(0, depth_paren - 1);
    }

    if (
      char === delimiter &&
      depth_angle === 0 &&
      depth_brace === 0 &&
      depth_bracket === 0 &&
      depth_paren === 0
    ) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
};

const parseDocBlock = (comment?: string) => {
  if (!comment) {
    return { description: undefined, default_value: undefined };
  }

  const lines = comment
    .replace(/^\/\*\*|\*\/$/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim());
  const description_lines: string[] = [];
  let default_value: string | undefined;

  lines.forEach((line) => {
    if (!line) {
      return;
    }

    if (line.startsWith("@default")) {
      default_value = line.replace(/^@default\s+/, "").trim() || undefined;
      return;
    }

    if (line.startsWith("@")) {
      return;
    }

    description_lines.push(line);
  });

  return {
    description: description_lines.length > 0 ? description_lines.join(" ") : undefined,
    default_value,
  };
};

const parsePropsObjectLiteral = (literal: string, source: CatalogProp["source"]) => {
  const properties = [
    ...literal.matchAll(
      /(?:\/\*\*([\s\S]*?)\*\/\s*)?([A-Za-z_$][A-Za-z0-9_$]*)(\??):\s*([\s\S]*?);/g
    ),
  ];

  return properties
    .map((match) => {
      const metadata = parseDocBlock(match[1]);
      const type = match[4]?.replace(/\s+/g, " ").trim() ?? "";

      if (!match[2] || !type) {
        return undefined;
      }

      return {
        name: match[2],
        type,
        required: match[3] !== "?",
        source,
        ...(metadata.description ? { description: metadata.description } : {}),
        ...(metadata.default_value ? { default_value: metadata.default_value } : {}),
      } satisfies CatalogProp;
    })
    .filter((value): value is CatalogProp => Boolean(value));
};

const extractTypeAssignment = (source: string, marker: string) => {
  const marker_index = source.indexOf(marker);

  if (marker_index === -1) {
    return undefined;
  }

  let depth_angle = 0;
  let depth_brace = 0;
  let depth_bracket = 0;
  let depth_paren = 0;
  let in_string: string | null = null;
  let in_line_comment = false;
  let in_block_comment = false;
  let buffer = "";

  for (let index = marker_index + marker.length; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    const prev = source[index - 1];

    if (in_line_comment) {
      if (char === "\n") {
        in_line_comment = false;
      }
      buffer += char;
      continue;
    }

    if (in_block_comment) {
      if (prev === "*" && char === "/") {
        in_block_comment = false;
      }
      buffer += char;
      continue;
    }

    if (in_string) {
      if (char === in_string && prev !== "\\") {
        in_string = null;
      }
      buffer += char;
      continue;
    }

    if (char === "/" && next === "/") {
      in_line_comment = true;
      buffer += char;
      continue;
    }

    if (char === "/" && next === "*") {
      in_block_comment = true;
      buffer += char;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      in_string = char;
      buffer += char;
      continue;
    }

    if (char === "<") {
      depth_angle += 1;
    } else if (char === ">") {
      depth_angle = Math.max(0, depth_angle - 1);
    } else if (char === "{") {
      depth_brace += 1;
    } else if (char === "}") {
      depth_brace = Math.max(0, depth_brace - 1);
    } else if (char === "[") {
      depth_bracket += 1;
    } else if (char === "]") {
      depth_bracket = Math.max(0, depth_bracket - 1);
    } else if (char === "(") {
      depth_paren += 1;
    } else if (char === ")") {
      depth_paren = Math.max(0, depth_paren - 1);
    }

    if (
      char === ";" &&
      depth_angle === 0 &&
      depth_brace === 0 &&
      depth_bracket === 0 &&
      depth_paren === 0
    ) {
      return buffer.trim();
    }

    buffer += char;
  }

  return buffer.trim() || undefined;
};

const extractCustomPropsFromTypeExpression = (
  type_expression: string,
  source: CatalogProp["source"]
) => {
  const match = type_expression.match(/&\s*{/);

  if (!match) {
    return [] satisfies CatalogProp[];
  }

  const open_index = type_expression.indexOf("{", match.index);
  const object_literal = extractBalancedSegment(type_expression, open_index, "{", "}");

  return object_literal ? parsePropsObjectLiteral(object_literal, source) : [];
};

const extractTypeAliasProps = (source: string, alias_name: string) => {
  const assignment = extractTypeAssignment(source, `type ${alias_name} =`);
  return assignment ? extractCustomPropsFromTypeExpression(assignment, "source") : [];
};

const extractForwardRefTypeExpression = (source: string, component_name: string) => {
  const marker = `const ${component_name} = React.forwardRef<`;
  const marker_index = source.indexOf(marker);

  if (marker_index === -1) {
    return undefined;
  }

  const open_index = source.indexOf("<", marker_index + marker.length - 1);
  const generic = open_index >= 0 ? extractBalancedSegment(source, open_index, "<", ">") : undefined;

  if (!generic) {
    return undefined;
  }

  const [_, ...rest] = splitTopLevel(generic.slice(1, -1), ",");
  return rest.join(", ").trim() || undefined;
};

const extractForwardRefProps = (source: string, component_name: string) => {
  const type_expression = extractForwardRefTypeExpression(source, component_name);
  return type_expression ? extractCustomPropsFromTypeExpression(type_expression, "source") : [];
};

const mergeProps = (...prop_sets: CatalogProp[][]) => {
  const merged = new Map<string, CatalogProp>();

  prop_sets.forEach((props) => {
    props.forEach((prop) => {
      const existing = merged.get(prop.name);

      if (!existing) {
        merged.set(prop.name, prop);
        return;
      }

      merged.set(prop.name, {
        ...existing,
        ...prop,
        required: existing.required || prop.required,
        description: prop.description ?? existing.description,
        default_value: prop.default_value ?? existing.default_value,
      });
    });
  });

  return [...merged.values()].sort((left, right) => compareStrings(left.name, right.name));
};

const parseDocProps = (content: string, source_text: string) => {
  const expression = extractAttributeExpression(content, "content=");

  if (!expression) {
    return [] satisfies CatalogProp[];
  }

  const rows = safeEval<unknown[]>(expression);

  if (!Array.isArray(rows)) {
    return [] satisfies CatalogProp[];
  }

  const getCell = (cell: unknown) => {
    if (typeof cell === "string") {
      return { value: cell };
    }

    if (cell && typeof cell === "object" && "value" in cell) {
      const value = String((cell as { value: unknown }).value);
      const description =
        "description" in (cell as object)
          ? String((cell as { description?: unknown }).description ?? "")
          : undefined;
      return { value, description };
    }

    return { value: "" };
  };

  const parsed_rows: Array<CatalogProp | undefined> = rows.map((row) => {
      if (!Array.isArray(row) || row.length < 2) {
        return undefined;
      }

      const prop = getCell(row[0]);
      const type = getCell(row[1]);
      const default_value = getCell(row[2]);
      const required_match = source_text.match(
        new RegExp(`\\b${prop.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\??):`)
      );

      return {
        name: prop.value,
        type: type.value,
        required: Boolean(required_match && required_match[1] !== "?"),
        source: "docs" as const,
        ...(default_value.value ? { default_value: default_value.value } : {}),
        ...(prop.description ? { description: prop.description } : {}),
      };
    });

  return parsed_rows.filter((value): value is CatalogProp => Boolean(value));
};

const parseDocMetadata = async (docs_path: string, source_map: Map<string, ComponentSource>) => {
  const raw = await readText(docs_path);
  const parsed = matter(raw);
  const source_path = normalizeGithubPath(
    parsed.data?.links && typeof parsed.data.links === "object"
      ? String((parsed.data.links as Record<string, unknown>).source ?? "")
      : undefined
  );
  const title = String(parsed.data.title ?? titleFromSlug(docs_path.split("/").at(-1)?.replace(/\.mdx$/, "") ?? ""));
  const matched_source = source_path ? source_map.get(source_path) : undefined;
  const resolved_source_path =
    matched_source && slugify(matched_source.component_name) === slugify(title) ? source_path : undefined;
  const source_text =
    matched_source && resolved_source_path
      ? await readText(join(paths.repo_root, matched_source.source_path))
      : "";

  return {
    title,
    description: String(parsed.data.description ?? ""),
    source_path: resolved_source_path,
    props: parseDocProps(raw, source_text),
    example_names: [...raw.matchAll(/<PreviewComponent\s+name="([^"]+)"\s*\/>/g)].map(
      (match) => match[1]
    ).filter((value): value is string => Boolean(value)),
  } satisfies DocsMetadata;
};

const parseImportedSymbols = (clause: string) => {
  const symbols: string[] = [];
  const named = clause.match(/\{([^}]+)\}/);

  if (named?.[1]) {
    symbols.push(
      ...named[1]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.replace(/^type\s+/, "").split(/\s+as\s+/)[0] ?? part)
    );
  }

  if (clause.includes("* as")) {
    symbols.push("*");
  } else {
    const without_named = clause.replace(/\{[^}]+\}/, "").trim().replace(/,$/, "").trim();

    if (without_named && !without_named.startsWith("type ")) {
      symbols.push(without_named.split(",")[0]?.trim() ?? without_named);
    }
  }

  return unique(symbols.filter((value): value is string => Boolean(value)));
};

const parseDependencies = (source: string) => {
  const dependencies = new Map<
    string,
    { name: string; kind: ReturnType<typeof classify_dependency>; imported_symbols: string[] }
  >();

  for (const match of source.matchAll(/import\s+([\s\S]*?)\s+from\s+["']([^"']+)["'];/g)) {
    const clause = match[1]?.replace(/\s+/g, " ").trim() ?? "";
    const specifier = match[2] ?? "";

    if (!specifier || specifier.startsWith(".")) {
      continue;
    }

    const existing = dependencies.get(specifier);
    const imported_symbols = parseImportedSymbols(clause);

    dependencies.set(specifier, {
      name: specifier,
      kind: classify_dependency(specifier),
      imported_symbols: unique([...(existing?.imported_symbols ?? []), ...imported_symbols]).sort(),
    });
  }

  return [...dependencies.values()].sort((left, right) => compareStrings(left.name, right.name));
};

const extractUtilityClasses = (source: string) => {
  const utilities = new Set<string>();

  for (const candidate of collectStringLiterals(source)) {
    const tokens = candidate
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .filter(
        (token) =>
          /[-:[\]/]/.test(token) &&
          /^[!@%._:/\-[\]a-zA-Z0-9]+$/.test(token) &&
          !token.startsWith("http") &&
          !/^[-]{5,}$/.test(token)
      );

    for (const token of tokens) {
      utilities.add(token);
    }
  }

  return [...utilities].sort(compareStrings);
};

const extractStyleHooks = (source: string, utility_classes: string[]) => {
  const hooks = new Set(
    utility_classes
      .filter((token) => token.startsWith("data-[") || token.startsWith("[&"))
      .filter((token) => !/^[-]{5,}$/.test(token))
  );

  for (const match of source.matchAll(/--[a-z][a-z0-9-]*/gi)) {
    hooks.add(match[0]);
  }

  for (const match of source.matchAll(/\bwg-[a-z0-9-]+\b/gi)) {
    hooks.add(match[0]);
  }

  return [...hooks].sort(compareStrings);
};

const extractAccessibility = (source: string) => {
  const roles = unique(
    [...source.matchAll(/role="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((value): value is string => Boolean(value))
  ).sort(compareStrings);
  const labels = unique(
    [...source.matchAll(/aria-label(?:=|:)\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/g)]
      .map((match) => match[1] ?? match[2] ?? match[3])
      .filter((value): value is string => Boolean(value))
  ).sort(compareStrings);
  const keyboard_support = unique(
    [
      ...source.matchAll(/e\.key\s*===\s*"([^"]+)"/g),
      ...source.matchAll(/e\.key\s*===\s*'([^']+)'/g),
    ]
      .map((match) => match[1])
      .filter((value): value is string => Boolean(value))
  ).sort(compareStrings);
  const notes = unique(
    [
      source.includes("tabIndex") ? "tab-focusable" : undefined,
      source.includes("onKeyDown") ? "custom-keyboard-handler" : undefined,
      source.includes("@radix-ui/") ? "radix-primitive" : undefined,
    ].filter((value): value is string => Boolean(value))
  );

  return {
    roles,
    labels,
    keyboard_support,
    notes: notes.length > 0 ? notes : undefined,
  };
};

const parseVariantLiterals = (type_value: string) =>
  [...type_value.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value));

const parseVariantsFromFile = async (variants_path: string) => {
  if (!(await fileExists(variants_path))) {
    return [] satisfies CatalogVariant[];
  }

  const raw = await readText(variants_path);
  const variants = new Map<string, Set<string>>();
  const marker = "variants:";
  let search_start = 0;

  while (search_start < raw.length) {
    const marker_index = raw.indexOf(marker, search_start);

    if (marker_index === -1) {
      break;
    }

    const open_index = raw.indexOf("{", marker_index + marker.length);

    if (open_index === -1) {
      break;
    }

    const segment = extractBalancedSegment(raw, open_index, "{", "}");

    if (!segment) {
      break;
    }

    try {
      const object = safeEval<Record<string, Record<string, string>>>(segment);

      for (const [name, value] of Object.entries(object)) {
        if (!value || typeof value !== "object") {
          continue;
        }

        const bucket = variants.get(name) ?? new Set<string>();
        for (const key of Object.keys(value)) {
          bucket.add(key);
        }
        variants.set(name, bucket);
      }
    } catch {
      // Ignore variant parsing failures and keep richer docs/story metadata.
    }

    search_start = open_index + segment.length;
  }

  return [...variants.entries()]
    .map(([name, values]) => ({
      name,
      values: [...values].sort(compareStrings),
      source: "source" as const,
    }))
    .sort((left, right) => compareStrings(left.name, right.name));
};

const storyControlType = (control: unknown) => {
  if (typeof control === "string") {
    return control;
  }

  if (control && typeof control === "object" && "type" in control) {
    return String((control as { type?: unknown }).type ?? "");
  }

  return "";
};

const storyPropType = (config: { control?: unknown; options?: unknown[] }) => {
  const options = Array.isArray(config.options)
    ? config.options.map((value) => JSON.stringify(value)).filter(Boolean)
    : [];

  if (options.length > 0) {
    return options.join(" | ");
  }

  const control = storyControlType(config.control);
  const control_map: Record<string, string> = {
    boolean: "boolean",
    number: "number",
    radio: "enum",
    select: "enum",
    text: "string",
  };

  return control_map[control] ?? "unknown";
};

const parseStoryProps = (
  arg_types: Record<
    string,
    {
      control?: unknown;
      description?: unknown;
      options?: unknown[];
      required?: unknown;
      table?: { defaultValue?: { summary?: unknown } };
    }
  >,
  args: Record<string, unknown>
) => {
  return Object.entries(arg_types)
    .map(([name, config]) => {
      const fallback_default = args[name];
      const default_value =
        config.table?.defaultValue?.summary !== undefined
          ? String(config.table.defaultValue.summary)
          : fallback_default !== undefined
            ? JSON.stringify(fallback_default)
            : undefined;

      return {
        name,
        type: storyPropType(config),
        required: Boolean(config.required),
        source: "story" as const,
        ...(typeof config.description === "string" ? { description: config.description } : {}),
        ...(default_value ? { default_value } : {}),
      } satisfies CatalogProp;
    })
    .sort((left, right) => compareStrings(left.name, right.name));
};

const parseStoryMetadata = async (story_path: string) => {
  const raw = await readText(story_path);
  const arg_types_segment = extractObjectLiteral(raw, "argTypes:");
  const args_segment = extractObjectLiteral(raw, "args:");
  const variants = new Map<string, Set<string>>();
  let props: CatalogProp[] = [];

  if (arg_types_segment) {
    try {
      const arg_types = safeEval<
        Record<
          string,
          {
            control?: unknown;
            description?: unknown;
            options?: unknown[];
            required?: unknown;
            table?: { defaultValue?: { summary?: unknown } };
          }
        >
      >(arg_types_segment);
      const args = args_segment ? safeEval<Record<string, unknown>>(args_segment) : {};

      props = parseStoryProps(arg_types, args);

      for (const [name, config] of Object.entries(arg_types)) {
        if (!Array.isArray(config?.options) || config.options.length === 0) {
          continue;
        }

        variants.set(
          name,
          new Set(
            config.options.map((value) => String(value)).filter((value) => value.length > 0)
          )
        );
      }
    } catch {
      // Ignore story parsing issues and keep doc/source-derived metadata.
    }
  }

  const story_file = repoRelative(paths.repo_root, story_path);
  const story_examples = [...raw.matchAll(/export const (\w+)/g)].map((match) => ({
    id: `story:${slugify(match[1] ?? "story")}`,
    title: titleFromSlug(match[1] ?? "story"),
    file_path: story_file,
    code: raw,
  }));

  return {
    props,
    variants: [...variants.entries()].map(([name, values]) => ({
      name,
      values: [...values].sort(compareStrings),
      source: "story" as const,
    })),
    examples: story_examples,
  } satisfies StoryMetadata;
};

const loadExample = async (example_name: string) => {
  const file_path = join(paths.docs_root, "src/examples", `${example_name}.tsx`);

  if (!(await fileExists(file_path))) {
    return undefined;
  }

  return {
    id: `docs:${slugify(example_name)}`,
    title: titleFromSlug(example_name.split("/").at(-1) ?? example_name),
    file_path: repoRelative(paths.repo_root, file_path),
    code: await readText(file_path),
    source: "docs-example" as const,
  };
};

const discoverComponentSources = async () => {
  const components_dir = join(paths.ui_root, "src/components");
  const directories = await readdir(components_dir, { withFileTypes: true });
  const sources: ComponentSource[] = [];

  for (const directory of directories) {
    if (!directory.isDirectory() || directory.name === "icons") {
      continue;
    }

    const index_path = join(components_dir, directory.name, "index.ts");

    if (!(await fileExists(index_path))) {
      continue;
    }

    const index_source = await readText(index_path);

    for (const match of index_source.matchAll(
      /export\s+\{\s+default\s+as\s+(\w+)\s+\}\s+from\s+"\.\/([^"]+)";/g
    )) {
      const component_name = match[1];
      const file_name = match[2];

      if (!component_name || !file_name) {
        continue;
      }

      const source_path = join(components_dir, directory.name, `${file_name}.tsx`);
      const variants_path = join(components_dir, directory.name, "variants.ts");

      if (!(await fileExists(source_path))) {
        continue;
      }

      sources.push({
        component_name,
        slug: slugify(component_name),
        source_path: repoRelative(paths.repo_root, source_path),
        variants_path: (await fileExists(variants_path))
          ? repoRelative(paths.repo_root, variants_path)
          : undefined,
        index_path: repoRelative(paths.repo_root, index_path),
      });
    }

    for (const match of index_source.matchAll(/export\s+\*\s+from\s+"\.\/([^"]+)";/g)) {
      const file_name = match[1];

      if (!file_name) {
        continue;
      }

      const source_path = join(components_dir, directory.name, `${file_name}.tsx`);
      const variants_path = join(components_dir, directory.name, "variants.ts");

      if (!(await fileExists(source_path))) {
        continue;
      }

      sources.push({
        component_name: titleFromSlug(file_name),
        slug: slugify(file_name),
        source_path: repoRelative(paths.repo_root, source_path),
        variants_path: (await fileExists(variants_path))
          ? repoRelative(paths.repo_root, variants_path)
          : undefined,
        index_path: repoRelative(paths.repo_root, index_path),
      });
    }
  }

  return unique(sources.map((source) => JSON.stringify(source)))
    .map((source) => JSON.parse(source) as ComponentSource)
    .sort((left, right) => compareStrings(left.component_name, right.component_name));
};

const docsLookupKeys = (entry: DocsMetadata) =>
  unique([
    entry.source_path,
    entry.title,
    slugify(entry.title),
  ]).filter((value): value is string => Boolean(value));

const loadDocsMap = async (source_map: Map<string, ComponentSource>) => {
  const docs_dir = join(paths.docs_root, "public/docs/components");
  const docs_files = await listFiles(docs_dir, (path) => path.endsWith(".mdx"));
  const docs_entries = await Promise.all(docs_files.map((path) => parseDocMetadata(path, source_map)));

  const docs_map = new Map<string, DocsMetadata>();

  for (const entry of docs_entries) {
    docsLookupKeys(entry).forEach((key) => docs_map.set(key, entry));
  }

  return docs_map;
};

const loadStoryMap = async () => {
  const candidate_dirs = [
    join(paths.storybook_root, "src/stories"),
    join(paths.ui_root, "src/components"),
  ];
  const story_files = (
    await Promise.all(
      candidate_dirs.map(async (directory) =>
        (await fileExists(directory))
          ? listFiles(directory, (path) => path.endsWith(".stories.tsx"))
          : Promise.resolve([])
      )
    )
  ).flat();
  const story_entries = await Promise.all(story_files.map((path) => parseStoryMetadata(path)));
  const story_map = new Map<string, StoryMetadata>();

  story_files.forEach((story_path, index) => {
    const key = slugify(story_path.split("/").at(-1)?.replace(/\.stories\.tsx$/, "") ?? "");
    story_map.set(key, story_entries[index]!);
  });

  return story_map;
};

const buildVariants = (props: CatalogProp[], story: StoryMetadata | undefined, source: CatalogVariant[]) => {
  const variants = new Map<string, { values: Set<string>; source: CatalogVariant["source"] }>();

  for (const prop of props) {
    const literal_values = parseVariantLiterals(prop.type);

    if (literal_values.length === 0) {
      continue;
    }

    variants.set(prop.name, { values: new Set(literal_values), source: "docs" });
  }

  for (const story_variant of story?.variants ?? []) {
    const bucket = variants.get(story_variant.name) ?? { values: new Set<string>(), source: "story" };
    story_variant.values.forEach((value: string) => bucket.values.add(value));
    variants.set(story_variant.name, bucket);
  }

  for (const source_variant of source) {
    const bucket = variants.get(source_variant.name) ?? { values: new Set<string>(), source: "source" };
    source_variant.values.forEach((value: string) => bucket.values.add(value));
    variants.set(source_variant.name, bucket);
  }

  return [...variants.entries()]
    .map(([name, value]) => ({
      name,
      values: [...value.values].sort(compareStrings),
      source: value.source,
    }))
    .sort((left, right) => compareStrings(left.name, right.name));
};

const extractObjectAssignSubcomponents = (source: string, component_name: string) => {
  const marker = `const ${component_name} = Object.assign`;
  const marker_index = source.indexOf(marker);

  if (marker_index === -1) {
    return [] as Array<{ name: string; local_name: string }>;
  }

  const open_index = source.indexOf("{", marker_index);
  const object_literal = open_index >= 0 ? extractBalancedSegment(source, open_index, "{", "}") : undefined;

  if (!object_literal) {
    return [] as Array<{ name: string; local_name: string }>;
  }

  return [...object_literal.matchAll(/([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*([A-Za-z_$][A-Za-z0-9_$]*)/g)]
    .map((match) => ({
      name: match[1] ?? "",
      local_name: match[2] ?? "",
    }))
    .filter((value) => value.name && value.local_name);
};

const extractNamedComponentExports = (source: string, component_name: string) => {
  return [...source.matchAll(/export\s+\{([\s\S]*?)\};/g)]
    .flatMap((match) =>
      splitTopLevel(match[1] ?? "", ",").map((entry) => entry.replace(/^type\s+/, "").trim())
    )
    .map((entry) => {
      const [local_name, exported_name] = entry.split(/\s+as\s+/).map((value) => value.trim());
      const name = exported_name ?? local_name;

      if (!name || name === component_name || !name.startsWith(component_name)) {
        return undefined;
      }

      return {
        name: name.slice(component_name.length),
        local_name: local_name ?? name,
      };
    })
    .filter((value): value is { name: string; local_name: string } => Boolean(value?.name && value.local_name));
};

const extractSubcomponents = (source: string, component_name: string) => {
  const discovered = unique(
    [
      ...extractObjectAssignSubcomponents(source, component_name),
      ...extractNamedComponentExports(source, component_name),
    ].map((entry) => JSON.stringify(entry))
  )
    .map((entry) => JSON.parse(entry) as { name: string; local_name: string })
    .filter((entry) => entry.name !== "Root")
    .sort((left, right) => compareStrings(left.name, right.name));

  return discovered.map((entry) => {
    const props = mergeProps(
      extractTypeAliasProps(source, `${entry.local_name}Props`),
      extractForwardRefProps(source, entry.local_name)
    );

    return {
      name: entry.name,
      local_name: entry.local_name,
      props,
    } satisfies CatalogSubcomponent;
  });
};

const buildComponent = async (
  source: ComponentSource,
  docs: DocsMetadata | undefined,
  story: StoryMetadata | undefined
) => {
  const source_absolute = join(paths.repo_root, source.source_path);
  const source_text = await readText(source_absolute);
  const variants_text = source.variants_path ? await readText(join(paths.repo_root, source.variants_path)) : "";
  const utility_classes = extractUtilityClasses(`${source_text}\n${variants_text}`);
  const source_props = mergeProps(
    extractTypeAliasProps(source_text, `${source.component_name}Props`),
    extractForwardRefProps(source_text, source.component_name)
  );
  const props = mergeProps(source_props, story?.props ?? [], docs?.props ?? []);
  const variants = buildVariants(
    props,
    story,
    source.variants_path ? await parseVariantsFromFile(join(paths.repo_root, source.variants_path)) : []
  );
  const dependencies = parseDependencies(source_text);
  const description = docs?.description ?? `React component ${source.component_name}.`;
  const taxonomy = get_component_taxonomy(source.component_name, description);
  const example_entries = (
    await Promise.all(
      unique([...(docs?.example_names ?? [])]).map((example_name) => loadExample(example_name))
    )
  ).filter((value): value is NonNullable<typeof value> => Boolean(value));
  const story_examples = story?.examples.map((example) => ({ ...example, source: "story" as const })) ?? [];
  const subcomponents = extractSubcomponents(source_text, source.component_name);
  const slots = unique(
    props
      .map((prop) => prop.name)
      .filter((name) =>
        ["children", "before", "after", "title", "tooltip", "label", "helperText"].includes(name)
      )
  ).sort(compareStrings);
  const supported_themes = (
    source_text.includes("dark:") ? ["light", "dark"] : ["light"]
  ) as CatalogComponent["supported_themes"];
  const summary = chunkText(
    [
      sentence(description),
      `${props.length} documented props.`,
      `${variants.length} variant groups.`,
      dependencies.length > 0
        ? `Depends on ${dependencies
            .slice(0, 3)
            .map((dependency) => dependency.name)
            .join(", ")}.`
        : undefined,
      example_entries.length + story_examples.length > 0
        ? `${example_entries.length + story_examples.length} examples.`
        : undefined,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const accessibility = extractAccessibility(source_text);
  const style_hooks = extractStyleHooks(`${source_text}\n${variants_text}`, utility_classes);
  const tags = unique([
    source.slug,
    source.component_name.toLowerCase(),
    ...taxonomy.tags,
    ...normalizeQueryTokens(description),
  ]).sort(compareStrings);
  const examples = [...example_entries, ...story_examples].sort((left, right) =>
    compareStrings(left.id, right.id)
  );
  const component_id = `component:${source.slug}`;

  return {
    entry_type: "component",
    component_id,
    name: source.slug,
    display_name: docs?.title ?? source.component_name,
    framework: "react",
    status: docs ? "stable" : "preview",
    category_ids: taxonomy.category_ids,
    pattern_ids: taxonomy.pattern_ids,
    tags,
    intent_labels: taxonomy.intent_labels,
    source_path: source.source_path,
    description,
    summary,
    slots,
    props,
    variants,
    accessibility,
    dependencies,
    utility_classes,
    style_hooks,
    subcomponents,
    examples,
    token_ids: [],
    supported_themes,
    search_text: [
      docs?.title ?? source.component_name,
      description,
      summary,
      ...tags,
      ...taxonomy.intent_labels,
      ...taxonomy.pattern_ids,
      ...taxonomy.category_ids,
      ...props.flatMap((prop) => [prop.name, prop.type, prop.description ?? "", prop.default_value ?? ""]),
      ...variants.flatMap((variant) => [variant.name, ...variant.values]),
      ...dependencies.flatMap((dependency) => [dependency.name, ...dependency.imported_symbols]),
      ...subcomponents.flatMap((subcomponent) => [
        subcomponent.name,
        subcomponent.local_name,
        ...subcomponent.props.flatMap((prop) => [prop.name, prop.type, prop.description ?? ""]),
      ]),
      ...utility_classes,
      ...style_hooks,
      ...accessibility.roles,
      ...accessibility.labels,
      ...accessibility.keyboard_support,
    ]
      .filter(Boolean)
      .join(" "),
    family: source.slug,
  } satisfies CatalogComponent;
};

const loadFoundationTokens = async () => {
  const palette_module = (await import(
    toFileHref(join(paths.ui_root, "src/tw-plugin/foundation/colors/palette.ts"))
  )) as { palette: Record<string, Record<string, string>> };
  const themable_module = (await import(
    toFileHref(join(paths.ui_root, "src/tw-plugin/foundation/colors/themableColors.ts"))
  )) as { themableColors: Record<string, Record<string, string | Record<string, string>>> };
  const font_sizes_module = (await import(
    toFileHref(join(paths.ui_root, "src/tw-plugin/foundation/fontSizes.ts"))
  )) as {
    fontSizes: Record<string, [string, Record<string, string>]>;
  };
  const min_width_module = (await import(
    toFileHref(join(paths.ui_root, "src/tw-plugin/foundation/minWidth.ts"))
  )) as { minWidth: Record<string, string> };
  const shadows_module = (await import(
    toFileHref(join(paths.ui_root, "src/tw-plugin/foundation/shadows.ts"))
  )) as { boxShadows: Record<string, string> };

  return {
    palette: palette_module.palette,
    themable_colors: themable_module.themableColors,
    font_sizes: font_sizes_module.fontSizes,
    min_width: min_width_module.minWidth,
    box_shadows: shadows_module.boxShadows,
  };
};

const buildTokenSearchText = (token: CatalogToken) =>
  [token.display_name, token.name, token.raw_value, token.description, ...token.semantic_aliases, ...token.tags]
    .filter(Boolean)
    .join(" ");

const buildTokens = async (components: CatalogComponent[]) => {
  const foundation = await loadFoundationTokens();
  const tokens: CatalogToken[] = [];
  const utility_classes = unique(components.flatMap((component) => component.utility_classes));
  const pushToken = (token: Omit<CatalogToken, "search_text">) => {
    const complete = { ...token, search_text: buildTokenSearchText(token as CatalogToken) } satisfies CatalogToken;
    tokens.push(complete);
  };

  Object.entries(foundation.palette).forEach(([family, values]) => {
    Object.entries(values).forEach(([scale, raw_value]) => {
      pushToken({
        entry_type: "token",
        token_id: `token:color:palette.${family}.${scale}`,
        name: `palette.${family}.${scale}`,
        display_name: `Palette ${titleFromSlug(family)} ${scale}`,
        kind: "color",
        raw_value,
        semantic_aliases: [`color.palette.${family}.${scale}`, `wg-${family}-${scale}`],
        tags: ["palette", family, scale],
        source_path: "packages/ui/src/tw-plugin/foundation/colors/palette.ts",
        description: `Raw palette token for ${family} ${scale}.`,
        modes: ["base"],
      });
    });
  });

  Object.entries(foundation.themable_colors).forEach(([theme, groups]) => {
    Object.entries(groups).forEach(([group_name, group_value]) => {
      if (typeof group_value === "string") {
        pushToken({
          entry_type: "token",
          token_id: `token:color:${theme}.${group_name}.DEFAULT`,
          name: `${theme}.${group_name}.DEFAULT`,
          display_name: `${titleFromSlug(theme)} ${titleFromSlug(group_name)}`,
          kind: "color",
          raw_value: group_value,
          semantic_aliases: get_theme_aliases(theme, group_name, "DEFAULT"),
          tags: [theme, group_name, "theme"],
          source_path: "packages/ui/src/tw-plugin/foundation/colors/themableColors.ts",
          description: `${titleFromSlug(theme)} theme ${group_name} token.`,
          modes: [theme],
        });
        return;
      }

      Object.entries(group_value).forEach(([scale, raw_value]) => {
        pushToken({
          entry_type: "token",
          token_id: `token:color:${theme}.${group_name}.${scale}`,
          name: `${theme}.${group_name}.${scale}`,
          display_name: `${titleFromSlug(theme)} ${titleFromSlug(group_name)} ${scale}`,
          kind: "color",
          raw_value,
          semantic_aliases: get_theme_aliases(theme, group_name, scale),
          tags: [theme, group_name, scale, "theme"],
          source_path: "packages/ui/src/tw-plugin/foundation/colors/themableColors.ts",
          description: `${titleFromSlug(theme)} theme ${group_name} ${scale} token.`,
          modes: [theme],
        });
      });
    });
  });

  Object.entries(foundation.font_sizes).forEach(([name, [font_size, config]]) => {
    pushToken({
      entry_type: "token",
      token_id: `token:typography:${name}`,
      name: `font-size.${name}`,
      display_name: `Font Size ${name}`,
      kind: "typography",
      raw_value: JSON.stringify({ font_size, ...config }),
      semantic_aliases: [`typography.size.${name}`, `text-${name}`],
      tags: ["type", "font-size", name],
      source_path: "packages/ui/src/tw-plugin/foundation/fontSizes.ts",
      description: `Typography size token ${name}.`,
      modes: ["base"],
    });
  });

  Object.entries(foundation.min_width).forEach(([name, raw_value]) => {
    pushToken({
      entry_type: "token",
      token_id: `token:spacing:scale.${name}`,
      name: `spacing.scale.${name}`,
      display_name: `Spacing Scale ${name}`,
      kind: "spacing",
      raw_value,
      semantic_aliases: [`spacing.scale.${name}`, `size.min-width.${name}`],
      tags: ["spacing", "scale", name],
      source_path: "packages/ui/src/tw-plugin/foundation/minWidth.ts",
      description: `Shared spacing and sizing scale ${name}.`,
      modes: ["base"],
    });
  });

  Object.entries(foundation.box_shadows).forEach(([name, raw_value]) => {
    pushToken({
      entry_type: "token",
      token_id: `token:shadow:${name}`,
      name: `shadow.${name}`,
      display_name: `Shadow ${titleFromSlug(name)}`,
      kind: "shadow",
      raw_value,
      semantic_aliases: [`shadow.${name}`, `shadow-wg-${name}`],
      tags: ["shadow", name],
      source_path: "packages/ui/src/tw-plugin/foundation/shadows.ts",
      description: `Shadow token ${name}.`,
      modes: ["base"],
    });
  });

  const utility_token_groups = [
    {
      kind: "spacing" as const,
      matcher: /^(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|min-w|max-w|w|h)-.+$/,
      description: "Spacing or sizing utility token derived from component usage.",
      source_path: "packages/ui/src/components",
      alias: (token: string) => [`spacing.utility.${token.replace(/[^a-z0-9]+/gi, ".")}`, token],
    },
    {
      kind: "radius" as const,
      matcher: /^rounded(?:-[a-z0-9-]+)?$/,
      description: "Radius utility token derived from component usage.",
      source_path: "packages/ui/src/components",
      alias: (token: string) => [`radius.utility.${token.replace(/[^a-z0-9]+/gi, ".")}`, token],
    },
    {
      kind: "motion" as const,
      matcher: /^(?:duration-\d+|ease-[a-z-]+|animate-[a-z-]+|transition(?:-[a-z-]+)?)$/,
      description: "Motion utility token derived from component usage.",
      source_path: "packages/ui/src/components",
      alias: (token: string) => [`motion.utility.${token.replace(/[^a-z0-9]+/gi, ".")}`, token],
    },
    {
      kind: "z-index" as const,
      matcher: /^z-\d+$/,
      description: "Z-index utility token derived from component usage.",
      source_path: "packages/ui/src/components",
      alias: (token: string) => [`z-index.utility.${token.replace(/[^a-z0-9]+/gi, ".")}`, token],
    },
  ];

  utility_classes.forEach((utility) => {
    utility_token_groups.forEach((group) => {
      if (!group.matcher.test(utility)) {
        return;
      }

      pushToken({
        entry_type: "token",
        token_id: `token:${group.kind}:${slugify(utility)}`,
        name: utility,
        display_name: utility,
        kind: group.kind,
        raw_value: utility,
        semantic_aliases: group.alias(utility),
        tags: [group.kind, "utility"],
        source_path: group.source_path,
        description: group.description,
        modes: ["base"],
      });
    });
  });

  return tokens.sort((left, right) => compareStrings(left.token_id, right.token_id));
};

const buildManifest = (
  components: CatalogComponent[],
  tokens: CatalogToken[],
  patterns: CatalogPattern[]
): CatalogManifest => ({
  version: "1.0.0",
  generated_at: new Date().toISOString(),
  source_roots: ["packages/ui", "apps/docs", "apps/storybook"],
  counts: {
    components: components.length,
    tokens: tokens.length,
    patterns: patterns.length,
    categories: get_categories().length,
  },
});

export const parse_catalog_artifacts = async () => {
  const component_sources = await discoverComponentSources();
  const source_map = new Map(component_sources.map((source) => [source.source_path, source] as const));
  const docs_map = await loadDocsMap(source_map);
  const extra_sources = await Promise.all(
    [...docs_map.values()]
      .filter((docs) => docs.source_path && !source_map.has(docs.source_path))
      .map(async (docs) => {
        const source_path = docs.source_path!;
        const variants_path = source_path.replace(/\/[^/]+\.tsx$/, "/variants.ts");

        if (!(await fileExists(join(paths.repo_root, source_path)))) {
          return undefined;
        }

        return {
          component_name: docs.title,
          slug: slugify(docs.title),
          source_path,
          variants_path: (await fileExists(join(paths.repo_root, variants_path)))
            ? variants_path
            : undefined,
          index_path: source_path.replace(/\/[^/]+\.tsx$/, "/index.ts"),
        } satisfies ComponentSource;
      })
  );
  const all_component_sources = unique([
    ...component_sources.map((source) => JSON.stringify(source)),
    ...extra_sources
      .filter((source): source is NonNullable<typeof source> => Boolean(source))
      .map((source) => JSON.stringify(source)),
  ])
    .map((source) => JSON.parse(source) as ComponentSource)
    .sort((left, right) => compareStrings(left.component_name, right.component_name));
  const story_map = await loadStoryMap();
  const components = await Promise.all(
    all_component_sources.map((source) =>
      buildComponent(
        source,
        docs_map.get(source.source_path) ?? docs_map.get(source.slug),
        story_map.get(source.slug)
      )
    )
  );
  const tokens = await buildTokens(components);
  const token_links = link_component_tokens(components, tokens);
  const token_ids_by_component = token_links.reduce<Map<string, string[]>>((map, link) => {
    const bucket = map.get(link.component_id) ?? [];
    bucket.push(link.token_id);
    map.set(link.component_id, bucket);
    return map;
  }, new Map());
  const enriched_components = components.map((component) => ({
    ...component,
    token_ids: (token_ids_by_component.get(component.component_id) ?? []).sort(compareStrings),
  }));
  const component_ids_by_slug = new Map(
    enriched_components.map((component) => [component.name, component.component_id])
  );
  const patterns = build_patterns(component_ids_by_slug);
  const artifacts = {
    manifest: buildManifest(components, tokens, patterns),
    components: enriched_components.sort((left, right) => compareStrings(left.component_id, right.component_id)),
    tokens,
    patterns,
    categories: get_categories(),
  } satisfies CatalogArtifacts;

  return catalog_artifacts_schema.parse(artifacts);
};

export const write_catalog_artifacts = async (artifacts: CatalogArtifacts) => {
  await ensureDir(paths.catalog_dir);

  await Promise.all([
    writeJson(join(paths.catalog_dir, "manifest.json"), artifacts.manifest),
    writeJson(join(paths.catalog_dir, "components.json"), artifacts.components),
    writeJson(join(paths.catalog_dir, "tokens.json"), artifacts.tokens),
    writeJson(join(paths.catalog_dir, "patterns.json"), artifacts.patterns),
    writeJson(join(paths.catalog_dir, "categories.json"), artifacts.categories),
    writeFile(join(paths.catalog_dir, "catalog.schema.json"), await readFile(paths.schema_path, "utf8"), "utf8"),
  ]);
};

export const load_catalog_artifacts = async () => {
  const [manifest, components, tokens, patterns, categories] = await Promise.all([
    readText(join(paths.catalog_dir, "manifest.json")),
    readText(join(paths.catalog_dir, "components.json")),
    readText(join(paths.catalog_dir, "tokens.json")),
    readText(join(paths.catalog_dir, "patterns.json")),
    readText(join(paths.catalog_dir, "categories.json")),
  ]);

  return catalog_artifacts_schema.parse({
    manifest: JSON.parse(manifest),
    components: JSON.parse(components),
    tokens: JSON.parse(tokens),
    patterns: JSON.parse(patterns),
    categories: JSON.parse(categories),
  } satisfies CatalogArtifacts);
};
