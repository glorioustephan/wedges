import type {
  CatalogCategory,
  CatalogComponent,
  CatalogPattern,
  CatalogToken,
} from "../shared/contracts.js";
import {
  compareStrings,
  expandLookupValues,
  maybeJsonParse,
  normalizeLookupValue,
  normalizeQueryTokens,
} from "../shared/utils.js";
import { ftsScoreSql, open_runtime_database } from "../db/build-db.js";
import { SqliteWasmDatabase } from "../db/sqlite.js";

type ComponentRow = {
  component_id: string;
  name: string;
  display_name: string;
  framework: string;
  status: string;
  family: string;
  source_path: string;
  description: string;
  summary: string;
  category_ids_json: string;
  pattern_ids_json: string;
  tags_json: string;
  intent_labels_json: string;
  slots_json: string;
  props_json: string;
  variants_json: string;
  accessibility_json: string;
  dependencies_json: string;
  utility_classes_json: string;
  style_hooks_json: string;
  subcomponents_json: string;
  examples_json: string;
  token_ids_json: string;
  supported_themes_json: string;
  search_text: string;
  fts_score?: number;
};

type TokenRow = {
  token_id: string;
  name: string;
  display_name: string;
  kind: string;
  raw_value: string;
  semantic_aliases_json: string;
  tags_json: string;
  source_path: string;
  description: string;
  modes_json: string;
  search_text: string;
  fts_score?: number;
};

type PatternRow = {
  pattern_id: string;
  name: string;
  display_name: string;
  description: string;
  category_id: string;
  tags_json: string;
  component_ids_json: string;
  search_text: string;
  fts_score?: number;
};

type CategoryRow = {
  category_id: string;
  name: string;
  display_name: string;
  description: string;
  tags_json: string;
};

type ComponentAuxRow = {
  component_id: string;
  fts_score?: number;
};

type ExactLookupRow = {
  field_kind: string;
  source_value: string;
  weight: number;
};

type ComponentExactLookupRow = ExactLookupRow & {
  component_id: string;
};

type TokenExactLookupRow = ExactLookupRow & {
  token_id: string;
};

type PatternExactLookupRow = ExactLookupRow & {
  pattern_id: string;
};

type StyleRow = {
  component_id: string;
  style_value: string;
  style_kind: string;
  style_family: string;
  token_id: string | null;
  display_name: string;
  source_path: string;
  token_display_name?: string;
  token_raw_value?: string;
  fts_score?: number;
};

export type CatalogStyleMatch = {
  component_id: string;
  display_name: string;
  source_path: string;
  style_value: string;
  style_kind: string;
  style_family: string;
  token_id: string | null;
  token_display_name?: string;
  token_raw_value?: string;
};

type StyleExactLookupRow = ExactLookupRow & StyleRow;

type ScoreBreakdown = Record<string, number>;

type FtsQueryPlan = {
  label: string;
  query: string;
};

type ScoredMatch = {
  score: number;
  breakdown: ScoreBreakdown;
  coverage: number;
  exactness: number;
};

export type SearchMatchEvidence = {
  field: string;
  value: string;
  match_type: "exact" | "term";
};

export type RankedResult<T> = {
  item: T;
  score: number;
  debug?: ScoreBreakdown;
  evidence?: SearchMatchEvidence[];
  rationale?: string;
};

export type ComponentSearchOptions = {
  query: string;
  category?: string;
  framework?: string;
  theme?: "light" | "dark";
  status?: CatalogComponent["status"];
  limit?: number;
  debug?: boolean;
};

export type TokenSearchOptions = {
  query: string;
  kind?: CatalogToken["kind"];
  mode?: string;
  limit?: number;
  debug?: boolean;
};

export type PatternSearchOptions = {
  query: string;
  limit?: number;
  debug?: boolean;
};

export type StyleSearchOptions = {
  query: string;
  component?: string;
  style_kind?: "utility-class" | "style-hook" | "design-token";
  style_family?: string;
  limit?: number;
  debug?: boolean;
};

const parseComponent = (row: ComponentRow): CatalogComponent => ({
  entry_type: "component",
  component_id: row.component_id,
  name: row.name,
  display_name: row.display_name,
  framework: row.framework as CatalogComponent["framework"],
  status: row.status as CatalogComponent["status"],
  family: row.family,
  source_path: row.source_path,
  description: row.description,
  summary: row.summary,
  category_ids: maybeJsonParse<string[]>(row.category_ids_json, []),
  pattern_ids: maybeJsonParse<string[]>(row.pattern_ids_json, []),
  tags: maybeJsonParse<string[]>(row.tags_json, []),
  intent_labels: maybeJsonParse<string[]>(row.intent_labels_json, []),
  slots: maybeJsonParse<string[]>(row.slots_json, []),
  props: maybeJsonParse<CatalogComponent["props"]>(row.props_json, []),
  variants: maybeJsonParse<CatalogComponent["variants"]>(row.variants_json, []),
  accessibility: maybeJsonParse<CatalogComponent["accessibility"]>(row.accessibility_json, {
    roles: [],
    labels: [],
    keyboard_support: [],
  }),
  dependencies: maybeJsonParse<CatalogComponent["dependencies"]>(row.dependencies_json, []),
  utility_classes: maybeJsonParse<string[]>(row.utility_classes_json, []),
  style_hooks: maybeJsonParse<string[]>(row.style_hooks_json, []),
  subcomponents: maybeJsonParse<CatalogComponent["subcomponents"]>(row.subcomponents_json, []),
  examples: maybeJsonParse<CatalogComponent["examples"]>(row.examples_json, []),
  token_ids: maybeJsonParse<string[]>(row.token_ids_json, []),
  supported_themes: maybeJsonParse<CatalogComponent["supported_themes"]>(
    row.supported_themes_json,
    ["light"]
  ),
  search_text: row.search_text,
});

const parseToken = (row: TokenRow): CatalogToken => ({
  entry_type: "token",
  token_id: row.token_id,
  name: row.name,
  display_name: row.display_name,
  kind: row.kind as CatalogToken["kind"],
  raw_value: row.raw_value,
  semantic_aliases: maybeJsonParse<string[]>(row.semantic_aliases_json, []),
  tags: maybeJsonParse<string[]>(row.tags_json, []),
  source_path: row.source_path,
  description: row.description,
  modes: maybeJsonParse<string[]>(row.modes_json, []),
  search_text: row.search_text,
});

const parsePattern = (row: PatternRow): CatalogPattern => ({
  entry_type: "pattern",
  pattern_id: row.pattern_id,
  name: row.name,
  display_name: row.display_name,
  description: row.description,
  category_id: row.category_id,
  tags: maybeJsonParse<string[]>(row.tags_json, []),
  component_ids: maybeJsonParse<string[]>(row.component_ids_json, []),
  search_text: row.search_text,
});

const parseCategory = (row: CategoryRow): CatalogCategory => ({
  entry_type: "category",
  category_id: row.category_id,
  name: row.name,
  display_name: row.display_name,
  description: row.description,
  tags: maybeJsonParse<string[]>(row.tags_json, []),
});

const escapeFtsTerm = (value: string) => value.replace(/"/g, '""');

const buildFtsQueryPlans = (query: string) => {
  const trimmed = query.trim().toLowerCase();
  const terms = normalizeQueryTokens(query);
  const plans: FtsQueryPlan[] = [];
  const seen = new Set<string>();

  const push = (label: string, value?: string) => {
    if (!value || seen.has(value)) {
      return;
    }

    seen.add(value);
    plans.push({ label, query: value });
  };

  if (terms.length === 1) {
    const [term] = terms;
    push("exact-term", term ? `"${escapeFtsTerm(term)}"` : undefined);
  }

  if (terms.length > 1 && trimmed) {
    push("phrase", `"${escapeFtsTerm(trimmed)}"`);
    push(
      "and",
      terms.map((term) => `"${escapeFtsTerm(term)}"`).join(" AND ")
    );
  }

  push(
    "prefix-and",
    terms.map((term) => `"${escapeFtsTerm(term)}"*`).join(" AND ")
  );

  if (terms.length > 1) {
    push(
      "prefix-or",
      terms.map((term) => `"${escapeFtsTerm(term)}"*`).join(" OR ")
    );
  }

  return plans;
};

const normalizeCategoryFilter = (value?: string) => {
  if (!value) {
    return undefined;
  }

  return value.startsWith("category:") ? value : `category:${value}`;
};

const baseScore = (fts_score: number | undefined) => {
  if (typeof fts_score !== "number") {
    return 0;
  }

  if (fts_score === 0) {
    return 0.5;
  }

  return 4 / (1 + Math.abs(fts_score));
};

const lowerValues = (values: Array<string | null | undefined>) =>
  values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => value.toLowerCase());

const matchCount = (terms: string[], values: Array<string | null | undefined>) => {
  if (terms.length === 0) {
    return 0;
  }

  const lowered = lowerValues(values);
  return terms.filter((term) => lowered.some((value) => value.includes(term))).length;
};

const hasExactMatch = (needle: string, values: Array<string | null | undefined>) =>
  lowerValues(values).some((value) => value === needle);

const hasPhraseMatch = (needle: string, values: Array<string | null | undefined>) =>
  Boolean(needle) && lowerValues(values).some((value) => value.includes(needle));

const coverageBonus = (matches: number, total_terms: number) => {
  if (total_terms === 0 || matches === 0) {
    return 0;
  }

  if (matches === total_terms && total_terms > 1) {
    return 4;
  }

  return (matches / total_terms) * 2;
};

const compareNumbersDesc = (left: number, right: number) => right - left;

const formatEvidenceField = (field_kind: string) => field_kind.replace(/-/g, " ");

const dedupeEvidence = (evidence: SearchMatchEvidence[], limit = 5) => {
  const seen = new Set<string>();
  const results: SearchMatchEvidence[] = [];

  for (const entry of evidence) {
    const key = `${entry.match_type}:${entry.field}:${normalizeLookupValue(entry.value)}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(entry);

    if (results.length >= limit) {
      break;
    }
  }

  return results;
};

const rationaleFromEvidence = (evidence: SearchMatchEvidence[]) => {
  if (evidence.length === 0) {
    return undefined;
  }

  const top = evidence.slice(0, 2).map((entry) => {
    const prefix = entry.match_type === "exact" ? "exact " : "";
    return `${prefix}${entry.field} "${entry.value}"`;
  });

  return `Matched ${top.join(" and ")}.`;
};

const lookupBonus = (weight: number | undefined) =>
  typeof weight === "number" ? Math.min(weight / 20, 7) : 0;

const lookupExactness = (weight: number | undefined) => {
  if (typeof weight !== "number") {
    return 0;
  }

  if (weight >= 120) {
    return 3;
  }

  if (weight >= 95) {
    return 2;
  }

  return 1;
};

const collectValueEvidence = (
  terms: string[],
  values: Array<string | null | undefined>,
  field: string
) =>
  values.flatMap((value) => {
    if (!value) {
      return [];
    }

    const lowered = value.toLowerCase();
    return terms.some((term) => lowered.includes(term))
      ? [{ field, value, match_type: "term" as const }]
      : [];
  });

const collapseExactRows = <
  T extends {
    field_kind: string;
    source_value: string;
    weight: number;
  },
>(
  rows: T[],
  getId: (row: T) => string
) => {
  const collapsed = new Map<
    string,
    {
      exact_score: number;
      evidence: SearchMatchEvidence[];
    }
  >();

  rows.forEach((row) => {
    const id = getId(row);
    const existing = collapsed.get(id) ?? {
      exact_score: row.weight,
      evidence: [] as SearchMatchEvidence[],
    };

    existing.exact_score = Math.max(existing.exact_score, row.weight);
    existing.evidence.push({
      field: formatEvidenceField(row.field_kind),
      value: row.source_value,
      match_type: "exact",
    });
    collapsed.set(id, existing);
  });

  return new Map(
    [...collapsed.entries()].map(([id, value]) => [
      id,
      {
        exact_score: value.exact_score,
        evidence: dedupeEvidence(value.evidence),
      },
    ])
  );
};

const componentEvidence = (
  component: CatalogComponent,
  query: string,
  exact_evidence: SearchMatchEvidence[] = []
) => {
  const terms = normalizeQueryTokens(query);
  const heuristic = dedupeEvidence([
    ...collectValueEvidence(terms, [component.display_name, component.name, component.component_id], "name"),
    ...collectValueEvidence(terms, component.tags, "tag"),
    ...collectValueEvidence(terms, component.intent_labels, "intent"),
    ...collectValueEvidence(terms, component.props.map((prop) => prop.name), "prop"),
    ...collectValueEvidence(terms, component.subcomponents.map((subcomponent) => subcomponent.name), "subcomponent"),
    ...collectValueEvidence(
      terms,
      component.subcomponents.flatMap((subcomponent) =>
        subcomponent.props.map((prop) => `${subcomponent.name}.${prop.name}`)
      ),
      "subcomponent prop"
    ),
    ...collectValueEvidence(terms, component.token_ids, "token"),
    ...collectValueEvidence(terms, component.utility_classes, "utility class"),
    ...collectValueEvidence(terms, component.style_hooks, "style hook"),
  ]);

  const evidence = dedupeEvidence([...exact_evidence, ...heuristic]);
  return {
    evidence,
    rationale: rationaleFromEvidence(evidence),
  };
};

const tokenEvidence = (token: CatalogToken, query: string, exact_evidence: SearchMatchEvidence[] = []) => {
  const terms = normalizeQueryTokens(query);
  const heuristic = dedupeEvidence([
    ...collectValueEvidence(terms, [token.display_name, token.name, token.token_id], "name"),
    ...collectValueEvidence(terms, token.semantic_aliases, "alias"),
    ...collectValueEvidence(terms, token.tags, "tag"),
    ...collectValueEvidence(terms, [token.raw_value], "raw value"),
  ]);
  const evidence = dedupeEvidence([...exact_evidence, ...heuristic]);
  return {
    evidence,
    rationale: rationaleFromEvidence(evidence),
  };
};

const patternEvidence = (
  pattern: CatalogPattern,
  query: string,
  exact_evidence: SearchMatchEvidence[] = []
) => {
  const terms = normalizeQueryTokens(query);
  const heuristic = dedupeEvidence([
    ...collectValueEvidence(terms, [pattern.display_name, pattern.name, pattern.pattern_id], "name"),
    ...collectValueEvidence(terms, pattern.tags, "tag"),
    ...collectValueEvidence(terms, [pattern.description], "description"),
  ]);
  const evidence = dedupeEvidence([...exact_evidence, ...heuristic]);
  return {
    evidence,
    rationale: rationaleFromEvidence(evidence),
  };
};

const styleEvidence = (
  match: CatalogStyleMatch,
  query: string,
  exact_evidence: SearchMatchEvidence[] = []
) => {
  const terms = normalizeQueryTokens(query);
  const heuristic = dedupeEvidence([
    ...collectValueEvidence(terms, [match.style_value], "style value"),
    ...collectValueEvidence(terms, [match.style_kind], "style kind"),
    ...collectValueEvidence(terms, [match.style_family], "style family"),
    ...collectValueEvidence(terms, [match.token_id ?? "", match.token_display_name ?? ""], "token"),
  ]);
  const evidence = dedupeEvidence([...exact_evidence, ...heuristic]);
  return {
    evidence,
    rationale: rationaleFromEvidence(evidence),
  };
};

const runFtsPlans = <T>(
  plans: FtsQueryPlan[],
  execute: (fts_query: string) => T[],
  getKey: (row: T) => string,
  limit: number
) => {
  const results: T[] = [];
  const seen = new Set<string>();

  for (const plan of plans) {
    try {
      const rows = execute(plan.query);

      for (const row of rows) {
        const key = getKey(row);

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        results.push(row);

        if (results.length >= limit) {
          return results;
        }
      }
    } catch {
      // Try the next search strategy.
    }
  }

  return results;
};

const componentScore = (
  component: CatalogComponent,
  query: string,
  fts_score: number | undefined,
  aux_scores?: {
    exact?: number;
    api?: number;
    examples?: number;
    styles?: number;
  }
): ScoredMatch => {
  const tokens = normalizeQueryTokens(query);
  const lowered_query = query.toLowerCase().trim();
  const name_values = [component.component_id, component.name, component.display_name];
  const metadata_values = [...component.tags, ...component.intent_labels];
  const api_values = [
    ...component.props.flatMap((prop) => [prop.name, prop.type, prop.description ?? "", prop.default_value ?? ""]),
    ...component.subcomponents.flatMap((subcomponent) => [
      subcomponent.name,
      subcomponent.local_name,
      ...subcomponent.props.flatMap((prop) => [
        prop.name,
        prop.type,
        prop.description ?? "",
        prop.default_value ?? "",
      ]),
    ]),
  ];
  const token_values = component.token_ids;
  const text_values = [component.summary, component.description, component.search_text];
  const breakdown: ScoreBreakdown = {
    fts: baseScore(fts_score),
  };
  let exactness = 0;

  if (typeof aux_scores?.exact === "number") {
    breakdown.lookup = lookupBonus(aux_scores.exact);
    exactness += lookupExactness(aux_scores.exact);
  }

  if (lowered_query && hasExactMatch(lowered_query, name_values)) {
    breakdown.exact_name = 12;
    exactness += 3;
  } else if (lowered_query && hasPhraseMatch(lowered_query, name_values)) {
    breakdown.name_contains = 5;
    exactness += 1;
  }

  if (lowered_query && hasPhraseMatch(lowered_query, [...api_values, ...text_values])) {
    breakdown.phrase = 3;
    exactness += 1;
  }

  const nameTokenMatches = matchCount(tokens, name_values);
  if (nameTokenMatches > 0) {
    breakdown.name_terms = nameTokenMatches * 2.5;
  }

  const tagMatches = matchCount(tokens, metadata_values);
  if (tagMatches > 0) {
    breakdown.metadata = tagMatches * 1.5;
  }

  const apiMatches = matchCount(tokens, api_values);
  if (apiMatches > 0) {
    breakdown.api_terms = apiMatches * 2;
  }

  const tokenMatches = matchCount(tokens, token_values);
  if (tokenMatches > 0) {
    breakdown.tokens = tokenMatches * 1.75;
  }

  const descriptionMatches = matchCount(tokens, text_values);
  if (descriptionMatches > 0) {
    breakdown.text = descriptionMatches * 0.75;
  }

  if (typeof aux_scores?.api === "number") {
    breakdown.api = baseScore(aux_scores.api) * 2;
  }

  if (typeof aux_scores?.examples === "number") {
    breakdown.examples = baseScore(aux_scores.examples) * 0.75;
  }

  if (typeof aux_scores?.styles === "number") {
    breakdown.styles = baseScore(aux_scores.styles) * 1.25;
  }

  const coverage = matchCount(tokens, [
    ...name_values,
    ...metadata_values,
    ...api_values,
    ...token_values,
    ...text_values,
  ]);
  const coverage_boost = coverageBonus(coverage, tokens.length);
  if (coverage_boost > 0) {
    breakdown.coverage = coverage_boost;
  }

  const intentBoosts = [
    query.toLowerCase().includes("dark") && component.supported_themes.includes("dark") ? 1.5 : 0,
    query.toLowerCase().includes("nav") || query.toLowerCase().includes("navigation")
      ? component.pattern_ids.includes("pattern:navigation")
        ? 2
        : 0
      : 0,
    query.toLowerCase().includes("form")
      ? component.pattern_ids.includes("pattern:forms")
        ? 2
        : 0
      : 0,
    query.toLowerCase().includes("error") || query.toLowerCase().includes("danger")
      ? component.tags.some((tag) => ["alert", "error", "warning", "destructive"].includes(tag))
        ? 2
        : 0
      : 0,
    query.toLowerCase().includes("modal")
      ? component.pattern_ids.includes("pattern:overlays")
        ? 1.5
        : 0
      : 0,
    query.toLowerCase().includes("table")
      ? component.pattern_ids.includes("pattern:tables")
        ? 3
        : 0
      : 0,
  ].filter(Boolean);

  if (intentBoosts.length > 0) {
    breakdown.intent = intentBoosts.reduce((total, value) => total + value, 0);
  }

  const penalty = component.search_text.length / 5000 + component.examples.length / 16;
  if (penalty > 0) {
    breakdown.penalty = -penalty;
  }

  const score = Object.values(breakdown).reduce((total, value) => total + value, 0);
  return { score, breakdown, coverage, exactness };
};

const tokenScore = (
  token: CatalogToken,
  query: string,
  fts_score: number | undefined,
  exact_score?: number
): ScoredMatch => {
  const terms = normalizeQueryTokens(query);
  const lowered_query = query.toLowerCase().trim();
  const name_values = [token.token_id, token.name, token.display_name];
  const alias_values = token.semantic_aliases;
  const text_values = [token.description, token.raw_value, token.search_text];
  const breakdown: ScoreBreakdown = {
    fts: baseScore(fts_score),
  };
  let exactness = 0;

  if (typeof exact_score === "number") {
    breakdown.lookup = lookupBonus(exact_score);
    exactness += lookupExactness(exact_score);
  }

  if (lowered_query && hasExactMatch(lowered_query, name_values)) {
    breakdown.exact_name = 12;
    exactness += 3;
  }

  if (lowered_query && hasExactMatch(lowered_query, alias_values)) {
    breakdown.exact_alias = 10;
    exactness += 2;
  }

  if (lowered_query && hasPhraseMatch(lowered_query, [...name_values, ...alias_values, ...text_values])) {
    breakdown.phrase = 2.5;
    exactness += 1;
  }

  const aliasMatches = matchCount(terms, alias_values);
  if (aliasMatches > 0) {
    breakdown.alias = aliasMatches * 2;
  }

  if (token.name.toLowerCase().endsWith(".default") && matchCount(terms, [token.name]) > 0) {
    breakdown.default_variant = 1.5;
  }

  const textMatches = matchCount(terms, [...name_values, ...text_values]);
  if (textMatches > 0) {
    breakdown.text = textMatches;
  }

  const coverage = matchCount(terms, [...name_values, ...alias_values, ...text_values]);
  const coverage_boost = coverageBonus(coverage, terms.length);
  if (coverage_boost > 0) {
    breakdown.coverage = coverage_boost;
  }

  return {
    score: Object.values(breakdown).reduce((total, value) => total + value, 0),
    breakdown,
    coverage,
    exactness,
  };
};

const patternScore = (
  pattern: CatalogPattern,
  query: string,
  fts_score: number | undefined,
  exact_score?: number
): ScoredMatch => {
  const terms = normalizeQueryTokens(query);
  const lowered_query = query.toLowerCase().trim();
  const name_values = [pattern.pattern_id, pattern.name, pattern.display_name];
  const text_values = [pattern.description, pattern.search_text];
  const tag_values = pattern.tags;
  const breakdown: ScoreBreakdown = {
    fts: baseScore(fts_score),
  };
  let exactness = 0;

  if (typeof exact_score === "number") {
    breakdown.lookup = lookupBonus(exact_score);
    exactness += lookupExactness(exact_score);
  }

  if (lowered_query && hasExactMatch(lowered_query, name_values)) {
    breakdown.exact_name = 10;
    exactness += 3;
  }

  if (lowered_query && hasPhraseMatch(lowered_query, [...name_values, ...tag_values, ...text_values])) {
    breakdown.phrase = 2;
    exactness += 1;
  }

  const tagMatches = matchCount(terms, tag_values);
  if (tagMatches > 0) {
    breakdown.tags = tagMatches * 1.5;
  }

  const textMatches = matchCount(terms, [...name_values, ...text_values]);
  if (textMatches > 0) {
    breakdown.text = textMatches;
  }

  const coverage = matchCount(terms, [...name_values, ...tag_values, ...text_values]);
  const coverage_boost = coverageBonus(coverage, terms.length);
  if (coverage_boost > 0) {
    breakdown.coverage = coverage_boost;
  }

  return {
    score: Object.values(breakdown).reduce((total, value) => total + value, 0),
    breakdown,
    coverage,
    exactness,
  };
};

const styleScore = (
  match: CatalogStyleMatch,
  query: string,
  fts_score: number | undefined,
  exact_score?: number
): ScoredMatch => {
  const terms = normalizeQueryTokens(query);
  const lowered_query = query.toLowerCase().trim();
  const exact_values = [
    match.style_value,
    match.style_kind,
    match.style_family,
    match.token_id ?? "",
    match.token_display_name ?? "",
  ];
  const searchable_values = [
    ...exact_values,
    match.display_name,
    match.token_raw_value ?? "",
    match.source_path,
  ];
  const breakdown: ScoreBreakdown = {
    fts: baseScore(fts_score),
  };
  let exactness = 0;

  if (typeof exact_score === "number") {
    breakdown.lookup = lookupBonus(exact_score);
    exactness += lookupExactness(exact_score);
  }

  if (lowered_query && hasExactMatch(lowered_query, exact_values)) {
    breakdown.exact = 12;
    exactness += 3;
  }

  if (lowered_query && hasPhraseMatch(lowered_query, searchable_values)) {
    breakdown.phrase = 2.5;
    exactness += 1;
  }

  const fieldMatches = matchCount(terms, searchable_values);
  if (fieldMatches > 0) {
    breakdown.fields = fieldMatches * 1.75;
  }

  if (match.token_id) {
    breakdown.token = 1;
  }

  const coverage = matchCount(terms, searchable_values);
  const coverage_boost = coverageBonus(coverage, terms.length);
  if (coverage_boost > 0) {
    breakdown.coverage = coverage_boost;
  }

  return {
    score: Object.values(breakdown).reduce((total, value) => total + value, 0),
    breakdown,
    coverage,
    exactness,
  };
};

const collapseAuxMatches = (rows: ComponentAuxRow[]) => {
  const collapsed = new Map<string, number | undefined>();

  rows.forEach((row) => {
    const existing = collapsed.get(row.component_id);

    if (typeof existing === "number" && typeof row.fts_score === "number") {
      collapsed.set(row.component_id, Math.min(existing, row.fts_score));
      return;
    }

    collapsed.set(row.component_id, existing ?? row.fts_score);
  });

  return [...collapsed.entries()].map(([component_id, fts_score]) => ({ component_id, fts_score }));
};

export class CatalogSearchService {
  private constructor(
    private readonly database: SqliteWasmDatabase,
    private readonly fts_version: "fts5" | "fts4"
  ) {}

  static async create() {
    const database = await open_runtime_database();
    const fts_version =
      (database.value<string>("SELECT value FROM metadata WHERE key = 'fts_version'") as
        | "fts5"
        | "fts4"
        | undefined) ?? "fts4";

    return new CatalogSearchService(database, fts_version);
  }

  async close() {
    await this.database.close();
  }

  private lookupValues(query: string) {
    return dedupeEvidence(
      expandLookupValues(normalizeLookupValue(query)).map((value) => ({
        field: "lookup",
        value,
        match_type: "term" as const,
      })),
      10
    ).map((entry) => entry.value);
  }

  private componentExactMatches(query: string) {
    const values = this.lookupValues(query);

    if (values.length === 0) {
      return new Map<string, { exact_score: number; evidence: SearchMatchEvidence[] }>();
    }

    const placeholders = values.map(() => "?").join(", ");
    const rows = this.database.all<ComponentExactLookupRow>(
      `SELECT component_id, field_kind, source_value, weight
       FROM component_exact_lookup
       WHERE normalized_value IN (${placeholders})
       ORDER BY weight DESC, component_id ASC, field_kind ASC, source_value ASC
       LIMIT 200`,
      values
    );

    return collapseExactRows(rows, (row) => row.component_id);
  }

  private tokenExactMatches(query: string) {
    const values = this.lookupValues(query);

    if (values.length === 0) {
      return new Map<string, { exact_score: number; evidence: SearchMatchEvidence[] }>();
    }

    const placeholders = values.map(() => "?").join(", ");
    const rows = this.database.all<TokenExactLookupRow>(
      `SELECT token_id, field_kind, source_value, weight
       FROM token_exact_lookup
       WHERE normalized_value IN (${placeholders})
       ORDER BY weight DESC, token_id ASC, field_kind ASC, source_value ASC
       LIMIT 200`,
      values
    );

    return collapseExactRows(rows, (row) => row.token_id);
  }

  private patternExactMatches(query: string) {
    const values = this.lookupValues(query);

    if (values.length === 0) {
      return new Map<string, { exact_score: number; evidence: SearchMatchEvidence[] }>();
    }

    const placeholders = values.map(() => "?").join(", ");
    const rows = this.database.all<PatternExactLookupRow>(
      `SELECT pattern_id, field_kind, source_value, weight
       FROM pattern_exact_lookup
       WHERE normalized_value IN (${placeholders})
       ORDER BY weight DESC, pattern_id ASC, field_kind ASC, source_value ASC
       LIMIT 200`,
      values
    );

    return collapseExactRows(rows, (row) => row.pattern_id);
  }

  private styleExactMatches(query: string) {
    const values = this.lookupValues(query);

    if (values.length === 0) {
      return new Map<string, { exact_score: number; evidence: SearchMatchEvidence[] }>();
    }

    const placeholders = values.map(() => "?").join(", ");
    const rows = this.database.all<StyleExactLookupRow>(
      `SELECT s.component_id, s.style_value, s.style_kind, s.style_family, s.token_id,
              c.display_name, c.source_path, t.display_name AS token_display_name,
              t.raw_value AS token_raw_value,
              l.field_kind, l.source_value, l.weight
       FROM style_exact_lookup l
       JOIN component_styles s
         ON s.component_id = l.component_id
        AND s.style_value = l.style_value
        AND s.style_kind = l.style_kind
       JOIN components c ON c.component_id = s.component_id
       LEFT JOIN tokens t ON t.token_id = s.token_id
       WHERE l.normalized_value IN (${placeholders})
       ORDER BY l.weight DESC, s.component_id ASC, s.style_kind ASC, s.style_value ASC
       LIMIT 200`,
      values
    );

    return collapseExactRows(
      rows,
      (row) => [row.component_id, row.style_kind, row.style_family, row.style_value, row.token_id ?? ""].join(":")
    );
  }

  private componentCandidates(query: string) {
    const lowered = query.toLowerCase().trim();
    const exact = lowered
      ? this.database.all<ComponentRow>(
          `SELECT *, 0 AS fts_score
           FROM components
           WHERE lower(component_id) = ?
              OR lower(name) = ?
              OR lower(display_name) = ?
           LIMIT 20`,
          [lowered, lowered, lowered]
        )
      : [];

    const fts = runFtsPlans(
      buildFtsQueryPlans(query),
      (fts_query) =>
        this.database.all<ComponentRow>(
          `SELECT c.*, ${ftsScoreSql(this.fts_version, "components_fts", [
            12,
            24,
            20,
            5,
            5,
            6,
            12,
            7,
            14,
            5,
            12,
            2,
            1.5,
            0.5,
          ])} AS fts_score
           FROM components_fts
           JOIN components c ON c.component_id = components_fts.component_id
           WHERE components_fts MATCH ?
           LIMIT 100`,
          [fts_query]
        ),
      (row) => row.component_id,
      100
    );

    if (exact.length > 0 || fts.length > 0) {
      return [...exact, ...fts.filter((row) => !exact.some((match) => match.component_id === row.component_id))];
    }

    const like = `%${query.toLowerCase()}%`;
    return this.database.all<ComponentRow>(
      `SELECT *, 0 AS fts_score
       FROM components
       WHERE lower(search_text) LIKE ?
       LIMIT 100`,
      [like]
    );
  }

  private tokenCandidates(query: string) {
    const lowered = query.toLowerCase().trim();
    const exact = lowered
      ? this.database.all<TokenRow>(
          `SELECT *, 0 AS fts_score
           FROM tokens
           WHERE lower(token_id) = ?
              OR lower(name) = ?
              OR lower(display_name) = ?
           LIMIT 20`,
          [lowered, lowered, lowered]
        )
      : [];

    const fts = runFtsPlans(
      buildFtsQueryPlans(query),
      (fts_query) =>
        this.database.all<TokenRow>(
          `SELECT t.*, ${ftsScoreSql(this.fts_version, "tokens_fts", [14, 20, 18, 5, 10, 2, 0.5])} AS fts_score
           FROM tokens_fts
           JOIN tokens t ON t.token_id = tokens_fts.token_id
           WHERE tokens_fts MATCH ?
           LIMIT 100`,
          [fts_query]
        ),
      (row) => row.token_id,
      100
    );

    if (exact.length > 0 || fts.length > 0) {
      return [...exact, ...fts.filter((row) => !exact.some((match) => match.token_id === row.token_id))];
    }

    return this.database.all<TokenRow>(
      `SELECT *, 0 AS fts_score
       FROM tokens
       WHERE lower(search_text) LIKE ?
       LIMIT 100`,
      [`%${query.toLowerCase()}%`]
    );
  }

  private patternCandidates(query: string) {
    const lowered = query.toLowerCase().trim();
    const exact = lowered
      ? this.database.all<PatternRow>(
          `SELECT *, 0 AS fts_score
           FROM patterns
           WHERE lower(pattern_id) = ?
              OR lower(name) = ?
              OR lower(display_name) = ?
           LIMIT 20`,
          [lowered, lowered, lowered]
        )
      : [];

    const fts = runFtsPlans(
      buildFtsQueryPlans(query),
      (fts_query) =>
        this.database.all<PatternRow>(
          `SELECT p.*, ${ftsScoreSql(this.fts_version, "patterns_fts", [14, 18, 16, 5, 6, 2, 0.5])} AS fts_score
           FROM patterns_fts
           JOIN patterns p ON p.pattern_id = patterns_fts.pattern_id
           WHERE patterns_fts MATCH ?
           LIMIT 50`,
          [fts_query]
        ),
      (row) => row.pattern_id,
      50
    );

    if (exact.length > 0 || fts.length > 0) {
      return [...exact, ...fts.filter((row) => !exact.some((match) => match.pattern_id === row.pattern_id))];
    }

    return this.database.all<PatternRow>(
      `SELECT *, 0 AS fts_score
       FROM patterns
       WHERE lower(search_text) LIKE ?
       LIMIT 50`,
      [`%${query.toLowerCase()}%`]
    );
  }

  private componentApiMatches(query: string) {
    const fts = runFtsPlans(
      buildFtsQueryPlans(query),
      (fts_query) =>
        this.database.all<ComponentAuxRow>(
          `SELECT component_id, ${ftsScoreSql(this.fts_version, "component_api_fts", [6, 9, 5, 14, 2, 0.5])} AS fts_score
           FROM component_api_fts
           WHERE component_api_fts MATCH ?
           LIMIT 200`,
          [fts_query]
        ),
      (row) => `${row.component_id}:${row.fts_score ?? 0}`,
      200
    );

    if (fts.length > 0) {
      return collapseAuxMatches(fts);
    }

    return this.database.all<ComponentAuxRow>(
      `SELECT DISTINCT component_id, 0 AS fts_score
       FROM component_props
       WHERE lower(owner_name || ' ' || prop_name || ' ' || prop_type || ' ' || description) LIKE ?
       LIMIT 100`,
      [`%${query.toLowerCase()}%`]
    );
  }

  private componentExampleMatches(query: string) {
    const fts = runFtsPlans(
      buildFtsQueryPlans(query),
      (fts_query) =>
        this.database.all<ComponentAuxRow>(
          `SELECT component_id, ${ftsScoreSql(this.fts_version, "component_examples_fts", [5, 3, 12, 4, 3, 0.5])} AS fts_score
           FROM component_examples_fts
           WHERE component_examples_fts MATCH ?
           LIMIT 200`,
          [fts_query]
        ),
      (row) => `${row.component_id}:${row.fts_score ?? 0}`,
      200
    );

    if (fts.length > 0) {
      return collapseAuxMatches(fts);
    }

    return this.database.all<ComponentAuxRow>(
      `SELECT DISTINCT component_id, 0 AS fts_score
       FROM component_examples
       WHERE lower(title || ' ' || file_path || ' ' || source) LIKE ?
       LIMIT 100`,
      [`%${query.toLowerCase()}%`]
    );
  }

  private componentStyleMatches(query: string) {
    const fts = runFtsPlans(
      buildFtsQueryPlans(query),
      (fts_query) =>
        this.database.all<ComponentAuxRow>(
          `SELECT component_id, ${ftsScoreSql(this.fts_version, "component_styles_fts", [5, 5, 6, 16, 10, 0.5])} AS fts_score
           FROM component_styles_fts
           WHERE component_styles_fts MATCH ?
           LIMIT 200`,
          [fts_query]
        ),
      (row) => `${row.component_id}:${row.fts_score ?? 0}`,
      200
    );

    if (fts.length > 0) {
      return collapseAuxMatches(fts);
    }

    return this.database.all<ComponentAuxRow>(
      `SELECT DISTINCT component_id, 0 AS fts_score
       FROM component_styles
       WHERE lower(style_value || ' ' || style_kind || ' ' || style_family) LIKE ?
       LIMIT 100`,
      [`%${query.toLowerCase()}%`]
    );
  }

  private componentRowsByIds(component_ids: string[]) {
    if (component_ids.length === 0) {
      return [] as ComponentRow[];
    }

    const placeholders = component_ids.map(() => "?").join(", ");
    return this.database.all<ComponentRow>(
      `SELECT *
       FROM components
       WHERE component_id IN (${placeholders})`,
      component_ids
    );
  }

  private tokenRowsByIds(token_ids: string[]) {
    if (token_ids.length === 0) {
      return [] as TokenRow[];
    }

    const placeholders = token_ids.map(() => "?").join(", ");
    return this.database.all<TokenRow>(
      `SELECT *
       FROM tokens
       WHERE token_id IN (${placeholders})`,
      token_ids
    );
  }

  private patternRowsByIds(pattern_ids: string[]) {
    if (pattern_ids.length === 0) {
      return [] as PatternRow[];
    }

    const placeholders = pattern_ids.map(() => "?").join(", ");
    return this.database.all<PatternRow>(
      `SELECT *
       FROM patterns
       WHERE pattern_id IN (${placeholders})`,
      pattern_ids
    );
  }

  private styleRowsByKeys(keys: string[]) {
    if (keys.length === 0) {
      return [] as StyleRow[];
    }

    const placeholders = keys.map(() => "?").join(", ");
    return this.database.all<StyleRow>(
      `SELECT s.component_id, s.style_value, s.style_kind, s.style_family, s.token_id,
              c.display_name, c.source_path, t.display_name AS token_display_name,
              t.raw_value AS token_raw_value,
              0 AS fts_score
       FROM component_styles s
       JOIN components c ON c.component_id = s.component_id
       LEFT JOIN tokens t ON t.token_id = s.token_id
       WHERE (s.component_id || ':' || s.style_kind || ':' || s.style_family || ':' || s.style_value || ':' || coalesce(s.token_id, '')) IN (${placeholders})`,
      keys
    );
  }

  private styleCandidates(options: StyleSearchOptions) {
    const lowered = options.query.toLowerCase().trim();
    const exact = lowered
      ? this.database.all<StyleRow>(
          `SELECT s.component_id, s.style_value, s.style_kind, s.style_family, s.token_id,
                  c.display_name, c.source_path, t.display_name AS token_display_name,
                  t.raw_value AS token_raw_value,
                  0 AS fts_score
           FROM component_styles s
           JOIN components c ON c.component_id = s.component_id
           LEFT JOIN tokens t ON t.token_id = s.token_id
           WHERE lower(s.style_value) = ?
              OR lower(s.style_kind) = ?
              OR lower(s.style_family) = ?
              OR lower(coalesce(s.token_id, '')) = ?
              OR lower(coalesce(t.display_name, '')) = ?
           LIMIT 50`,
          [lowered, lowered, lowered, lowered, lowered]
        )
      : [];

    const fts = runFtsPlans(
      buildFtsQueryPlans(options.query),
      (fts_query) =>
        this.database.all<StyleRow>(
          `SELECT s.component_id, s.style_value, s.style_kind, s.style_family, s.token_id,
                  c.display_name, c.source_path, t.display_name AS token_display_name,
                  t.raw_value AS token_raw_value,
                  ${ftsScoreSql(this.fts_version, "component_styles_fts", [5, 5, 6, 16, 10, 0.5])} AS fts_score
           FROM component_styles_fts
           JOIN component_styles s
             ON s.component_id = component_styles_fts.component_id
            AND s.style_kind = component_styles_fts.style_kind
            AND s.style_family = component_styles_fts.style_family
            AND s.style_value = component_styles_fts.style_value
           JOIN components c ON c.component_id = s.component_id
           LEFT JOIN tokens t ON t.token_id = s.token_id
           WHERE component_styles_fts MATCH ?
           LIMIT 100`,
          [fts_query]
        ),
      (row) => [row.component_id, row.style_kind, row.style_family, row.style_value, row.token_id ?? ""].join(":"),
      100
    );

    if (exact.length > 0 || fts.length > 0) {
      return [
        ...exact,
        ...fts.filter(
          (row) =>
            !exact.some(
              (match) =>
                match.component_id === row.component_id &&
                match.style_kind === row.style_kind &&
                match.style_family === row.style_family &&
                match.style_value === row.style_value &&
                match.token_id === row.token_id
            )
        ),
      ];
    }

    return this.database.all<StyleRow>(
      `SELECT s.component_id, s.style_value, s.style_kind, s.style_family, s.token_id,
              c.display_name, c.source_path, t.display_name AS token_display_name,
              t.raw_value AS token_raw_value,
              0 AS fts_score
       FROM component_styles s
       JOIN components c ON c.component_id = s.component_id
       LEFT JOIN tokens t ON t.token_id = s.token_id
       WHERE lower(s.style_value || ' ' || s.style_kind || ' ' || s.style_family) LIKE ?
       LIMIT 100`,
      [`%${options.query.toLowerCase()}%`]
    );
  }

  async search_components(options: ComponentSearchOptions) {
    const limit = options.limit ?? 8;
    const category = normalizeCategoryFilter(options.category);
    const exact_matches = this.componentExactMatches(options.query);
    const candidates = new Map<
      string,
      {
        row?: ComponentRow;
        exact_score?: number;
        api_score?: number;
        examples_score?: number;
        styles_score?: number;
        evidence?: SearchMatchEvidence[];
      }
    >();

    exact_matches.forEach((match, component_id) => {
      const existing = candidates.get(component_id) ?? {};
      candidates.set(component_id, {
        ...existing,
        exact_score: Math.max(existing.exact_score ?? 0, match.exact_score),
        evidence: dedupeEvidence([...(existing.evidence ?? []), ...match.evidence]),
      });
    });

    this.componentCandidates(options.query).forEach((row) => {
      candidates.set(row.component_id, {
        ...(candidates.get(row.component_id) ?? {}),
        row,
      });
    });

    this.componentApiMatches(options.query).forEach((row) => {
      const existing = candidates.get(row.component_id) ?? {};
      candidates.set(row.component_id, {
        ...existing,
        api_score:
          typeof existing.api_score === "number" && typeof row.fts_score === "number"
            ? Math.min(existing.api_score, row.fts_score)
            : (existing.api_score ?? row.fts_score),
      });
    });

    this.componentExampleMatches(options.query).forEach((row) => {
      const existing = candidates.get(row.component_id) ?? {};
      candidates.set(row.component_id, {
        ...existing,
        examples_score:
          typeof existing.examples_score === "number" && typeof row.fts_score === "number"
            ? Math.min(existing.examples_score, row.fts_score)
            : (existing.examples_score ?? row.fts_score),
      });
    });

    this.componentStyleMatches(options.query).forEach((row) => {
      const existing = candidates.get(row.component_id) ?? {};
      candidates.set(row.component_id, {
        ...existing,
        styles_score:
          typeof existing.styles_score === "number" && typeof row.fts_score === "number"
            ? Math.min(existing.styles_score, row.fts_score)
            : (existing.styles_score ?? row.fts_score),
      });
    });

    const missing_rows = this.componentRowsByIds(
      [...candidates.entries()]
        .filter(([, value]) => !value.row)
        .map(([component_id]) => component_id)
    );

    missing_rows.forEach((row) => {
      const existing = candidates.get(row.component_id) ?? {};
      candidates.set(row.component_id, { ...existing, row });
    });

    const ranked = [...candidates.values()]
      .filter((value): value is typeof value & { row: ComponentRow } => Boolean(value.row))
      .map((candidate) => ({ candidate, item: parseComponent(candidate.row) }))
      .filter(({ item }) => {
        if (category && !item.category_ids.includes(category)) {
          return false;
        }

        if (options.framework && item.framework !== options.framework) {
          return false;
        }

        if (options.status && item.status !== options.status) {
          return false;
        }

        if (options.theme && !item.supported_themes.includes(options.theme)) {
          return false;
        }

        return true;
      })
      .map(({ candidate, item }) => {
        const context = componentEvidence(item, options.query, candidate.evidence);
        const scored = componentScore(item, options.query, candidate.row.fts_score, {
          exact: candidate.exact_score,
          api: candidate.api_score,
          examples: candidate.examples_score,
          styles: candidate.styles_score,
        });

        return {
          item,
          score: scored.score,
          debug: options.debug ? scored.breakdown : undefined,
          evidence: context.evidence,
          rationale: context.rationale,
          coverage: scored.coverage,
          exactness: scored.exactness,
        };
      })
      .sort(
        (left, right) =>
          compareNumbersDesc(left.score, right.score) ||
          compareNumbersDesc(left.exactness, right.exactness) ||
          compareNumbersDesc(left.coverage, right.coverage) ||
          compareStrings(left.item.display_name, right.item.display_name) ||
          compareStrings(left.item.component_id, right.item.component_id)
      )
      .map(({ coverage: _coverage, exactness: _exactness, ...result }) => result);

    return {
      total: ranked.length,
      results: ranked.slice(0, limit),
    };
  }

  async get_component(component_id_or_name: string) {
    const lowered = component_id_or_name.toLowerCase();
    const row = this.database.get<ComponentRow>(
      `SELECT *
       FROM components
       WHERE component_id = ?
          OR lower(name) = ?
          OR lower(display_name) = ?
       LIMIT 1`,
      [component_id_or_name, lowered, lowered]
    );

    return row ? parseComponent(row) : undefined;
  }

  async list_component_tokens(component_id: string) {
    const rows = this.database.all<TokenRow>(
      `SELECT t.*
       FROM component_tokens ct
       JOIN tokens t ON t.token_id = ct.token_id
       WHERE ct.component_id = ?
       ORDER BY t.display_name ASC`,
      [component_id]
    );

    return rows.map(parseToken);
  }

  async search_tokens(options: TokenSearchOptions) {
    const limit = options.limit ?? 8;
    const exact_matches = this.tokenExactMatches(options.query);
    const candidates = new Map<
      string,
      {
        row?: TokenRow;
        exact_score?: number;
        evidence?: SearchMatchEvidence[];
      }
    >();

    exact_matches.forEach((match, token_id) => {
      const existing = candidates.get(token_id) ?? {};
      candidates.set(token_id, {
        ...existing,
        exact_score: Math.max(existing.exact_score ?? 0, match.exact_score),
        evidence: dedupeEvidence([...(existing.evidence ?? []), ...match.evidence]),
      });
    });

    this.tokenCandidates(options.query).forEach((row) => {
      candidates.set(row.token_id, {
        ...(candidates.get(row.token_id) ?? {}),
        row,
      });
    });

    this.tokenRowsByIds(
      [...candidates.entries()]
        .filter(([, value]) => !value.row)
        .map(([token_id]) => token_id)
    ).forEach((row) => {
      const existing = candidates.get(row.token_id) ?? {};
      candidates.set(row.token_id, { ...existing, row });
    });

    const ranked = [...candidates.values()]
      .filter((value): value is typeof value & { row: TokenRow } => Boolean(value.row))
      .map((candidate) => ({ candidate, item: parseToken(candidate.row) }))
      .filter(({ item }) => {
        if (options.kind && item.kind !== options.kind) {
          return false;
        }

        if (options.mode && !item.modes.includes(options.mode)) {
          return false;
        }

        return true;
      })
      .map(({ candidate, item }) => {
        const context = tokenEvidence(item, options.query, candidate.evidence);
        const scored = tokenScore(item, options.query, candidate.row.fts_score, candidate.exact_score);

        return {
          item,
          score: scored.score,
          debug: options.debug ? scored.breakdown : undefined,
          evidence: context.evidence,
          rationale: context.rationale,
          coverage: scored.coverage,
          exactness: scored.exactness,
        };
      })
      .sort(
        (left, right) =>
          compareNumbersDesc(left.score, right.score) ||
          compareNumbersDesc(left.exactness, right.exactness) ||
          compareNumbersDesc(left.coverage, right.coverage) ||
          compareStrings(left.item.display_name, right.item.display_name) ||
          compareStrings(left.item.token_id, right.item.token_id)
      )
      .map(({ coverage: _coverage, exactness: _exactness, ...result }) => result);

    return {
      total: ranked.length,
      results: ranked.slice(0, limit),
    };
  }

  async get_token(token_id_or_name: string) {
    const lowered = token_id_or_name.toLowerCase();
    const row = this.database.get<TokenRow>(
      `SELECT *
       FROM tokens
       WHERE token_id = ?
          OR lower(name) = ?
          OR lower(display_name) = ?
       LIMIT 1`,
      [token_id_or_name, lowered, lowered]
    );

    return row ? parseToken(row) : undefined;
  }

  async search_patterns(options: PatternSearchOptions) {
    const limit = options.limit ?? 8;
    const exact_matches = this.patternExactMatches(options.query);
    const candidates = new Map<
      string,
      {
        row?: PatternRow;
        exact_score?: number;
        evidence?: SearchMatchEvidence[];
      }
    >();

    exact_matches.forEach((match, pattern_id) => {
      const existing = candidates.get(pattern_id) ?? {};
      candidates.set(pattern_id, {
        ...existing,
        exact_score: Math.max(existing.exact_score ?? 0, match.exact_score),
        evidence: dedupeEvidence([...(existing.evidence ?? []), ...match.evidence]),
      });
    });

    this.patternCandidates(options.query).forEach((row) => {
      candidates.set(row.pattern_id, {
        ...(candidates.get(row.pattern_id) ?? {}),
        row,
      });
    });

    this.patternRowsByIds(
      [...candidates.entries()]
        .filter(([, value]) => !value.row)
        .map(([pattern_id]) => pattern_id)
    ).forEach((row) => {
      const existing = candidates.get(row.pattern_id) ?? {};
      candidates.set(row.pattern_id, { ...existing, row });
    });

    const ranked = [...candidates.values()]
      .filter((value): value is typeof value & { row: PatternRow } => Boolean(value.row))
      .map((candidate) => {
        const item = parsePattern(candidate.row);
        const context = patternEvidence(item, options.query, candidate.evidence);
        const scored = patternScore(item, options.query, candidate.row.fts_score, candidate.exact_score);

        return {
          item,
          score: scored.score,
          debug: options.debug ? scored.breakdown : undefined,
          evidence: context.evidence,
          rationale: context.rationale,
          coverage: scored.coverage,
          exactness: scored.exactness,
        };
      })
      .sort(
        (left, right) =>
          compareNumbersDesc(left.score, right.score) ||
          compareNumbersDesc(left.exactness, right.exactness) ||
          compareNumbersDesc(left.coverage, right.coverage) ||
          compareStrings(left.item.display_name, right.item.display_name) ||
          compareStrings(left.item.pattern_id, right.item.pattern_id)
      )
      .map(({ coverage: _coverage, exactness: _exactness, ...result }) => result);

    return {
      total: ranked.length,
      results: ranked.slice(0, limit),
    };
  }

  async search_styles(options: StyleSearchOptions) {
    const limit = options.limit ?? 8;
    const component_filter = options.component?.toLowerCase();
    const exact_matches = this.styleExactMatches(options.query);
    const candidates = new Map<
      string,
      {
        row?: StyleRow;
        exact_score?: number;
        evidence?: SearchMatchEvidence[];
      }
    >();

    exact_matches.forEach((match, key) => {
      const existing = candidates.get(key) ?? {};
      candidates.set(key, {
        ...existing,
        exact_score: Math.max(existing.exact_score ?? 0, match.exact_score),
        evidence: dedupeEvidence([...(existing.evidence ?? []), ...match.evidence]),
      });
    });

    this.styleCandidates(options).forEach((row) => {
      const key = [row.component_id, row.style_kind, row.style_family, row.style_value, row.token_id ?? ""].join(":");
      candidates.set(key, {
        ...(candidates.get(key) ?? {}),
        row,
      });
    });

    this.styleRowsByKeys(
      [...candidates.entries()]
        .filter(([, value]) => !value.row)
        .map(([key]) => key)
    ).forEach((row) => {
      const key = [row.component_id, row.style_kind, row.style_family, row.style_value, row.token_id ?? ""].join(":");
      const existing = candidates.get(key) ?? {};
      candidates.set(key, { ...existing, row });
    });

    const ranked = [...candidates.values()]
      .filter((value): value is typeof value & { row: StyleRow } => Boolean(value.row))
      .map((candidate) => candidate.row)
      .filter((row) => {
        if (
          component_filter &&
          row.component_id.toLowerCase() !== component_filter &&
          row.display_name.toLowerCase() !== component_filter
        ) {
          return false;
        }

        if (options.style_kind && row.style_kind !== options.style_kind) {
          return false;
        }

        if (options.style_family && row.style_family !== options.style_family) {
          return false;
        }

        return true;
      })
      .map((row) => {
        const key = [row.component_id, row.style_kind, row.style_family, row.style_value, row.token_id ?? ""].join(":");
        const exact_match = candidates.get(key);
        const item = {
          component_id: row.component_id,
          display_name: row.display_name,
          source_path: row.source_path,
          style_value: row.style_value,
          style_kind: row.style_kind,
          style_family: row.style_family,
          token_id: row.token_id,
          ...(row.token_display_name ? { token_display_name: row.token_display_name } : {}),
          ...(row.token_raw_value ? { token_raw_value: row.token_raw_value } : {}),
        } satisfies CatalogStyleMatch;
        const context = styleEvidence(item, options.query, exact_match?.evidence);
        const scored = styleScore(item, options.query, row.fts_score, exact_match?.exact_score);

        return {
          item,
          score: scored.score,
          debug: options.debug ? scored.breakdown : undefined,
          evidence: context.evidence,
          rationale: context.rationale,
          coverage: scored.coverage,
          exactness: scored.exactness,
        };
      })
      .sort(
        (left, right) =>
          compareNumbersDesc(left.score, right.score) ||
          compareNumbersDesc(left.exactness, right.exactness) ||
          compareNumbersDesc(left.coverage, right.coverage) ||
          compareStrings(left.item.display_name, right.item.display_name) ||
          compareStrings(left.item.style_value, right.item.style_value) ||
          compareStrings(left.item.component_id, right.item.component_id)
      )
      .map(({ coverage: _coverage, exactness: _exactness, ...result }) => result);

    return {
      total: ranked.length,
      results: ranked.slice(0, limit),
    };
  }

  async list_categories() {
    return this.database
      .all<CategoryRow>(
        "SELECT category_id, name, display_name, description, tags_json FROM categories ORDER BY display_name ASC"
      )
      .map(parseCategory);
  }

  async find_by_dependency(dependency: string, limit = 8) {
    const rows = this.database.all<ComponentRow>(
      `SELECT c.*
       FROM component_dependencies d
       JOIN components c ON c.component_id = d.component_id
       WHERE lower(d.dependency_name) LIKE ?
       ORDER BY c.display_name ASC
       LIMIT ?`,
      [`%${dependency.toLowerCase()}%`, limit]
    );

    return rows.map(parseComponent);
  }
}
