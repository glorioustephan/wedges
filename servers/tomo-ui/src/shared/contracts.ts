import * as z from "zod/v4";

export const category_schema = z.object({
  entry_type: z.literal("category"),
  category_id: z.string(),
  name: z.string(),
  display_name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
});

export const prop_schema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  default_value: z.string().optional(),
  description: z.string().optional(),
  source: z.enum(["docs", "source", "story"]),
});

export const variant_schema = z.object({
  name: z.string(),
  values: z.array(z.string()),
  source: z.enum(["docs", "source", "story"]),
});

export const accessibility_schema = z.object({
  roles: z.array(z.string()),
  labels: z.array(z.string()),
  keyboard_support: z.array(z.string()),
  notes: z.array(z.string()).optional(),
});

export const dependency_schema = z.object({
  name: z.string(),
  kind: z.enum(["headless", "icons", "css-utility", "runtime", "testing", "other"]),
  imported_symbols: z.array(z.string()),
});

export const example_schema = z.object({
  id: z.string(),
  title: z.string(),
  file_path: z.string(),
  code: z.string(),
  source: z.enum(["docs-example", "story"]),
});

export const subcomponent_schema = z.object({
  name: z.string(),
  local_name: z.string(),
  props: z.array(prop_schema),
});

export const component_schema = z.object({
  entry_type: z.literal("component"),
  component_id: z.string(),
  name: z.string(),
  display_name: z.string(),
  framework: z.literal("react"),
  status: z.enum(["stable", "preview", "deprecated"]),
  category_ids: z.array(z.string()),
  pattern_ids: z.array(z.string()),
  tags: z.array(z.string()),
  intent_labels: z.array(z.string()),
  source_path: z.string(),
  description: z.string(),
  summary: z.string(),
  slots: z.array(z.string()),
  props: z.array(prop_schema),
  variants: z.array(variant_schema),
  accessibility: accessibility_schema,
  dependencies: z.array(dependency_schema),
  utility_classes: z.array(z.string()),
  style_hooks: z.array(z.string()),
  subcomponents: z.array(subcomponent_schema),
  examples: z.array(example_schema),
  token_ids: z.array(z.string()),
  supported_themes: z.array(z.enum(["light", "dark"])),
  search_text: z.string(),
  family: z.string(),
});

export const token_schema = z.object({
  entry_type: z.literal("token"),
  token_id: z.string(),
  name: z.string(),
  display_name: z.string(),
  kind: z.enum(["color", "typography", "spacing", "radius", "shadow", "motion", "z-index"]),
  raw_value: z.string(),
  semantic_aliases: z.array(z.string()),
  tags: z.array(z.string()),
  source_path: z.string(),
  description: z.string(),
  modes: z.array(z.string()),
  search_text: z.string(),
});

export const pattern_schema = z.object({
  entry_type: z.literal("pattern"),
  pattern_id: z.string(),
  name: z.string(),
  display_name: z.string(),
  description: z.string(),
  category_id: z.string(),
  tags: z.array(z.string()),
  component_ids: z.array(z.string()),
  search_text: z.string(),
});

export const manifest_schema = z.object({
  version: z.string(),
  generated_at: z.string(),
  source_roots: z.array(z.string()),
  counts: z.object({
    components: z.number().int().nonnegative(),
    tokens: z.number().int().nonnegative(),
    patterns: z.number().int().nonnegative(),
    categories: z.number().int().nonnegative(),
  }),
});

export const catalog_artifacts_schema = z.object({
  manifest: manifest_schema,
  components: z.array(component_schema),
  tokens: z.array(token_schema),
  patterns: z.array(pattern_schema),
  categories: z.array(category_schema),
});

export type CatalogCategory = z.infer<typeof category_schema>;
export type CatalogComponent = z.infer<typeof component_schema>;
export type CatalogProp = z.infer<typeof prop_schema>;
export type CatalogToken = z.infer<typeof token_schema>;
export type CatalogPattern = z.infer<typeof pattern_schema>;
export type CatalogVariant = z.infer<typeof variant_schema>;
export type CatalogSubcomponent = z.infer<typeof subcomponent_schema>;
export type CatalogManifest = z.infer<typeof manifest_schema>;
export type CatalogArtifacts = z.infer<typeof catalog_artifacts_schema>;
