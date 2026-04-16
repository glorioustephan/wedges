import type {
  CatalogBuildCard,
  CatalogBuildCardExample,
  CatalogBuildCardStyleSignal,
  CatalogBuildCardTokenSummary,
  CatalogBuildComparison,
  CatalogBuildComparisonItem,
  CatalogComponent,
  CatalogBuildCardSubcomponent,
  CatalogToken,
} from "./contracts.js";
import { chunkText, compareStrings, sentence, unique } from "./utils.js";

export const classifyStyleFamily = (style_value: string, style_kind: string) => {
  const lowered = style_value.toLowerCase();

  if (style_kind === "design-token") {
    return "token";
  }

  if (lowered.startsWith("--")) {
    return "css-variable";
  }

  if (
    lowered.startsWith("dark:") ||
    lowered.startsWith("hover:") ||
    lowered.startsWith("focus:") ||
    lowered.startsWith("focus-visible:") ||
    lowered.startsWith("disabled:") ||
    lowered.startsWith("data-[") ||
    lowered.startsWith("aria-") ||
    lowered.startsWith("group-") ||
    lowered.startsWith("peer-")
  ) {
    return "state";
  }

  if (/^(?:rounded|radius)/.test(lowered)) {
    return "radius";
  }

  if (/^(?:shadow|drop-shadow|outline)/.test(lowered) || lowered.includes("shadow-")) {
    return "shadow";
  }

  if (/^(?:duration-|ease-|animate-|transition)/.test(lowered) || lowered.includes("animate-")) {
    return "motion";
  }

  if (
    /^(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|min-w|max-w|w|h|size)-/.test(
      lowered
    )
  ) {
    return "spacing";
  }

  if (
    /^(?:font-|leading-|tracking-|uppercase|lowercase|capitalize|whitespace-|text-(?:xs|sm|base|lg|xl|\d))/.test(
      lowered
    )
  ) {
    return "typography";
  }

  if (
    /(?:bg-|text-|border-|outline-|fill-|stroke-)/.test(lowered) ||
    /(primary|secondary|surface|destructive|neutral|white|black|red|green|blue|yellow|orange|pink|purple|gray)/.test(
      lowered
    )
  ) {
    return "color";
  }

  if (
    /^(?:flex|grid|inline-|items-|justify-|content-|self-|place-|overflow|absolute|relative|sticky|top-|right-|bottom-|left-)/.test(
      lowered
    )
  ) {
    return "layout";
  }

  if (lowered.startsWith("wg-") || lowered.startsWith("[&")) {
    return "custom";
  }

  return "other";
};

const dedupeStrings = (values: Iterable<string>) => unique(Array.from(values).filter((value) => value.length > 0));

const takeLimit = <T>(values: T[], limit: number) => values.slice(0, Math.max(limit, 0));

const buildAccessibilityNotes = (component: CatalogComponent) =>
  takeLimit(
    dedupeStrings([
      ...component.accessibility.roles.map((role) => `role: ${role}`),
      ...component.accessibility.labels.map((label) => `label: ${label}`),
      ...component.accessibility.keyboard_support.map((support) => `keyboard: ${support}`),
      ...(component.accessibility.notes ?? []).map((note) => `note: ${note}`),
    ]),
    8
  );

const buildLinkedTokens = (
  component: CatalogComponent,
  token_map: Map<string, CatalogToken>,
  limit = 6
) => {
  const linked = component.token_ids.flatMap((token_id) => {
    const token = token_map.get(token_id);

    if (!token) {
      return [];
    }

    return [
      {
        token_id: token.token_id,
        display_name: token.display_name,
        kind: token.kind,
        raw_value: token.raw_value,
        semantic_aliases: takeLimit(token.semantic_aliases, 4),
      } satisfies CatalogBuildCardTokenSummary,
    ];
  });

  return takeLimit(linked, limit);
};

const buildStyleSignals = (
  component: CatalogComponent,
  token_map: Map<string, CatalogToken>,
  limit = 10
) => {
  const signals: CatalogBuildCardStyleSignal[] = [];
  const seen = new Set<string>();

  const push = (signal: CatalogBuildCardStyleSignal) => {
    const key = `${signal.style_kind}:${signal.style_family}:${signal.style_value}:${signal.token_id ?? ""}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    signals.push(signal);
  };

  component.utility_classes.forEach((style_value) => {
    push({
      style_value,
      style_kind: "utility-class",
      style_family: classifyStyleFamily(style_value, "utility-class"),
    });
  });

  component.style_hooks.forEach((style_value) => {
    push({
      style_value,
      style_kind: "style-hook",
      style_family: classifyStyleFamily(style_value, "style-hook"),
    });
  });

  component.token_ids.forEach((token_id) => {
    const token = token_map.get(token_id);

    if (!token) {
      return;
    }

    push({
      style_value: token.display_name,
      style_kind: "design-token",
      style_family: classifyStyleFamily(token.display_name, "design-token"),
      token_id: token.token_id,
      token_display_name: token.display_name,
    });
  });

  return takeLimit(signals, limit);
};

const buildExamples = (component: CatalogComponent, limit = 2): CatalogBuildCardExample[] =>
  takeLimit(
    component.examples.map((example) => ({
      id: example.id,
      title: example.title,
      file_path: example.file_path,
      source: example.source,
      snippet: chunkText(example.code, 280),
    })),
    limit
  );

const buildSubcomponents = (component: CatalogComponent, limit = 6): CatalogBuildCardSubcomponent[] =>
  takeLimit(
    component.subcomponents.map((subcomponent) => ({
      name: subcomponent.name,
      local_name: subcomponent.local_name,
      props: takeLimit(subcomponent.props, 4),
    })),
    limit
  );

const buildCompositionOrder = (component: CatalogComponent) =>
  dedupeStrings([
    ...component.slots.map((slot) => `slot: ${slot}`),
    ...component.subcomponents.map((subcomponent) => `subcomponent: ${subcomponent.name}`),
  ]);

const buildGuidance = (component: CatalogComponent) => {
  const description = sentence(component.description);
  const summary = sentence(component.summary);

  if (description && description !== summary) {
    return description;
  }

  if (summary) {
    return summary;
  }

  return `Use ${component.display_name} when you need ${component.family}.`;
};

const buildSearchText = (card: CatalogBuildCard) =>
  [
    card.display_name,
    card.name,
    card.summary,
    card.guidance,
    ...card.primary_props.flatMap((prop) => [prop.name, prop.type, prop.description ?? "", prop.default_value ?? ""]),
    ...card.variant_groups.flatMap((variant) => [variant.name, ...variant.values]),
    ...card.composition_order,
    ...card.subcomponents.flatMap((subcomponent) => [
      subcomponent.name,
      subcomponent.local_name,
      ...subcomponent.props.flatMap((prop) => [prop.name, prop.type, prop.description ?? ""]),
    ]),
    ...card.examples.flatMap((example) => [example.title, example.file_path, example.snippet]),
    ...card.accessibility_notes,
    ...card.token_ids,
    ...card.linked_tokens.flatMap((token) => [token.display_name, token.raw_value, ...token.semantic_aliases]),
    ...card.style_signals.flatMap((signal) => [
      signal.style_value,
      signal.style_kind,
      signal.style_family,
      signal.token_display_name ?? "",
    ]),
    ...card.pattern_ids,
    ...card.tags,
    ...card.intent_labels,
  ]
    .filter(Boolean)
    .join(" ");

export const build_component_card = (
  component: CatalogComponent,
  token_map: Map<string, CatalogToken>
): CatalogBuildCard => {
  const card = {
    entry_type: "component-card" as const,
    component_id: component.component_id,
    name: component.name,
    display_name: component.display_name,
    framework: component.framework,
    status: component.status,
    family: component.family,
    source_path: component.source_path,
    summary: component.summary,
    guidance: buildGuidance(component),
    primary_props: takeLimit(component.props, 4),
    variant_groups: takeLimit(component.variants, 4),
    composition_order: buildCompositionOrder(component),
    subcomponents: buildSubcomponents(component),
    examples: buildExamples(component),
    accessibility_notes: buildAccessibilityNotes(component),
    token_ids: [...component.token_ids],
    linked_tokens: buildLinkedTokens(component, token_map),
    style_signals: buildStyleSignals(component, token_map),
    category_ids: [...component.category_ids],
    pattern_ids: [...component.pattern_ids],
    tags: [...component.tags],
    intent_labels: [...component.intent_labels],
    supported_themes: [...component.supported_themes],
    search_text: "",
    rationale: `Canonical build card for ${component.display_name}.`,
    confidence: 1,
  } satisfies CatalogBuildCard;

  return {
    ...card,
    search_text: buildSearchText(card),
  };
};

const intersect = (lists: string[][]) => {
  if (lists.length === 0) {
    return [];
  }

  const [first, ...rest] = lists;
  const shared = new Set(first);
  rest.forEach((values) => {
    const next = new Set(values);
    Array.from(shared).forEach((value) => {
      if (!next.has(value)) {
        shared.delete(value);
      }
    });
  });

  return dedupeStrings(shared);
};

const uniqueByCard = (values: string[], shared: string[]) =>
  dedupeStrings(values.filter((value) => !shared.includes(value)));

export const compare_component_cards = (cards: CatalogBuildCard[]): CatalogBuildComparison => {
  const shared_props = intersect(cards.map((card) => card.primary_props.map((prop) => prop.name)));
  const shared_variant_groups = intersect(cards.map((card) => card.variant_groups.map((variant) => variant.name)));
  const shared_subcomponents = intersect(cards.map((card) => card.subcomponents.map((subcomponent) => subcomponent.name)));
  const shared_tokens = intersect(cards.map((card) => card.token_ids));
  const shared_style_signals = intersect(
    cards.map((card) =>
      card.style_signals.map(
        (signal) => `${signal.style_kind}:${signal.style_family}:${signal.style_value}:${signal.token_id ?? ""}`
      )
    )
  );
  const shared_accessibility_notes = intersect(cards.map((card) => card.accessibility_notes));

  return {
    shared: {
      props: shared_props,
      variant_groups: shared_variant_groups,
      subcomponents: shared_subcomponents,
      tokens: shared_tokens,
      style_signals: shared_style_signals,
      accessibility_notes: shared_accessibility_notes,
    },
    items: cards.map((card) => {
      const style_signals = card.style_signals.map(
        (signal) => `${signal.style_kind}:${signal.style_family}:${signal.style_value}:${signal.token_id ?? ""}`
      );

      return {
        component_id: card.component_id,
        display_name: card.display_name,
        guidance: card.guidance,
        unique_props: uniqueByCard(
          card.primary_props.map((prop) => prop.name),
          shared_props
        ),
        unique_variant_groups: uniqueByCard(
          card.variant_groups.map((variant) => variant.name),
          shared_variant_groups
        ),
        unique_subcomponents: uniqueByCard(
          card.subcomponents.map((subcomponent) => subcomponent.name),
          shared_subcomponents
        ),
        unique_tokens: uniqueByCard(card.token_ids, shared_tokens),
        unique_style_signals: uniqueByCard(style_signals, shared_style_signals),
        unique_accessibility_notes: uniqueByCard(card.accessibility_notes, shared_accessibility_notes),
      } satisfies CatalogBuildComparisonItem;
    }),
  };
};

export const build_context_steps = (card: CatalogBuildCard) => {
  const steps = [
    `Use ${card.display_name} as the canonical ${card.family} component.`,
    card.composition_order.length > 0
      ? `Compose it in this order: ${card.composition_order.join(" -> ")}.`
      : `No compound composition is required for this component.`,
    card.primary_props.length > 0
      ? `Set the primary props first: ${card.primary_props.map((prop) => prop.name).join(", ")}.`
      : `Keep the prop surface minimal and prefer defaults.`,
    card.style_signals.length > 0
      ? `Reuse the style signals: ${card.style_signals
          .map((signal) => signal.token_display_name ?? signal.style_value)
          .join(", ")}.`
      : `Keep styling aligned with the existing theme tokens and utility classes.`,
    card.accessibility_notes.length > 0
      ? `Check accessibility notes: ${card.accessibility_notes.slice(0, 3).join("; ")}.`
      : `Verify keyboard support, labelling, and focus behavior.`,
  ];

  return dedupeStrings(steps);
};

export const build_card_score = (score: number, confidence = 1) =>
  Number(((Math.max(score, 0) / 100) * confidence).toFixed(3));

export const compare_card_labels = (left: CatalogBuildCard, right: CatalogBuildCard) =>
  compareStrings(left.display_name, right.display_name) || compareStrings(left.component_id, right.component_id);
