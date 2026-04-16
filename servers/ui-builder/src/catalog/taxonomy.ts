import type { CatalogCategory, CatalogPattern } from "../shared/contracts.js";
import { slugify } from "../shared/utils.js";

type ComponentTaxonomy = {
  category_ids: string[];
  pattern_ids: string[];
  tags: string[];
  intent_labels: string[];
};

const category_definitions: CatalogCategory[] = [
  {
    entry_type: "category",
    category_id: "category:inputs",
    name: "inputs",
    display_name: "Inputs",
    description: "Field-level input controls and supporting labels.",
    tags: ["forms", "fields", "entry"],
  },
  {
    entry_type: "category",
    category_id: "category:selection",
    name: "selection",
    display_name: "Selection",
    description: "Choice controls, toggles, and grouped selectors.",
    tags: ["choice", "toggle", "group"],
  },
  {
    entry_type: "category",
    category_id: "category:feedback",
    name: "feedback",
    display_name: "Feedback",
    description: "Status, loading, and progress communication patterns.",
    tags: ["status", "loading", "progress"],
  },
  {
    entry_type: "category",
    category_id: "category:overlays",
    name: "overlays",
    display_name: "Overlays",
    description: "Popups, menus, and contextual surfaces layered over content.",
    tags: ["popover", "tooltip", "menu"],
  },
  {
    entry_type: "category",
    category_id: "category:navigation",
    name: "navigation",
    display_name: "Navigation",
    description: "Navigational structures and segmented controls.",
    tags: ["nav", "menu", "tabs"],
  },
  {
    entry_type: "category",
    category_id: "category:display",
    name: "display",
    display_name: "Display",
    description: "Display primitives for short status or descriptive content.",
    tags: ["badge", "tag", "copy"],
  },
  {
    entry_type: "category",
    category_id: "category:identity",
    name: "identity",
    display_name: "Identity",
    description: "Identity and profile-oriented media components.",
    tags: ["avatar", "profile", "user"],
  },
];

const pattern_definitions = [
  {
    pattern_id: "pattern:forms",
    name: "forms",
    display_name: "Forms",
    category_id: "category:inputs",
    description: "Compositions for capture, validation, and submission flows.",
    tags: ["form", "input", "validation"],
    component_slugs: [
      "button",
      "checkbox",
      "checkbox-group",
      "input",
      "label",
      "radio-group",
      "select",
      "slider",
      "switch",
      "switch-group",
      "textarea",
      "toggle",
      "toggle-group",
    ],
  },
  {
    pattern_id: "pattern:navigation",
    name: "navigation",
    display_name: "Navigation",
    category_id: "category:navigation",
    description: "Navigation structures such as tabs and menus.",
    tags: ["nav", "menu", "tabs", "wayfinding"],
    component_slugs: ["button-group", "dropdown-menu", "kbd", "tabs"],
  },
  {
    pattern_id: "pattern:overlays",
    name: "overlays",
    display_name: "Overlays",
    category_id: "category:overlays",
    description: "Layered surfaces, tooltips, popovers, and contextual menus.",
    tags: ["popover", "tooltip", "dropdown", "layer"],
    component_slugs: ["dropdown-menu", "popover", "select", "tooltip"],
  },
  {
    pattern_id: "pattern:tables",
    name: "tables",
    display_name: "Tables",
    category_id: "category:display",
    description: "Data-dense tabular patterns and supporting affordances.",
    tags: ["table", "data-grid", "data-table"],
    component_slugs: [],
  },
  {
    pattern_id: "pattern:empty-states",
    name: "empty-states",
    display_name: "Empty States",
    category_id: "category:feedback",
    description: "Empty-state communication and call-to-action surfaces.",
    tags: ["empty", "blank-slate", "cta"],
    component_slugs: ["alert", "button", "loading"],
  },
  {
    pattern_id: "pattern:feedback",
    name: "feedback",
    display_name: "Feedback",
    category_id: "category:feedback",
    description: "Progress, alerting, and status feedback patterns.",
    tags: ["alert", "progress", "loading", "status"],
    component_slugs: ["alert", "badge", "loading", "progress-bar", "progress-circle", "tag"],
  },
];

const component_taxonomy: Record<string, ComponentTaxonomy> = {
  alert: {
    category_ids: ["category:feedback"],
    pattern_ids: ["pattern:feedback", "pattern:empty-states"],
    tags: ["alert", "banner", "error", "warning", "notice"],
    intent_labels: ["status-message", "error-state", "callout"],
  },
  avatar: {
    category_ids: ["category:identity"],
    pattern_ids: [],
    tags: ["avatar", "profile", "user", "media"],
    intent_labels: ["identity", "profile"],
  },
  "avatar-group": {
    category_ids: ["category:identity"],
    pattern_ids: [],
    tags: ["avatar", "team", "stacked", "profile"],
    intent_labels: ["identity", "group-presence"],
  },
  badge: {
    category_ids: ["category:display", "category:feedback"],
    pattern_ids: ["pattern:feedback"],
    tags: ["badge", "status", "label"],
    intent_labels: ["status-indicator", "count"],
  },
  button: {
    category_ids: ["category:inputs"],
    pattern_ids: ["pattern:forms", "pattern:empty-states"],
    tags: ["button", "action", "cta"],
    intent_labels: ["primary-action", "submit", "cta"],
  },
  "button-group": {
    category_ids: ["category:navigation", "category:inputs"],
    pattern_ids: ["pattern:forms", "pattern:navigation"],
    tags: ["button-group", "segmented", "toolbar"],
    intent_labels: ["segmented-control", "quick-actions"],
  },
  checkbox: {
    category_ids: ["category:selection"],
    pattern_ids: ["pattern:forms"],
    tags: ["checkbox", "selection", "boolean"],
    intent_labels: ["selection-control", "preference"],
  },
  "checkbox-group": {
    category_ids: ["category:selection"],
    pattern_ids: ["pattern:forms"],
    tags: ["checkbox-group", "multi-select", "list"],
    intent_labels: ["group-selection", "preferences"],
  },
  "dropdown-menu": {
    category_ids: ["category:overlays", "category:navigation"],
    pattern_ids: ["pattern:navigation", "pattern:overlays"],
    tags: ["dropdown", "menu", "actions"],
    intent_labels: ["context-menu", "action-menu", "overflow-menu"],
  },
  input: {
    category_ids: ["category:inputs"],
    pattern_ids: ["pattern:forms"],
    tags: ["input", "text-field", "field"],
    intent_labels: ["text-entry", "forms"],
  },
  kbd: {
    category_ids: ["category:display", "category:navigation"],
    pattern_ids: ["pattern:navigation"],
    tags: ["keyboard", "shortcut", "hint"],
    intent_labels: ["shortcut-hint", "documentation"],
  },
  label: {
    category_ids: ["category:inputs"],
    pattern_ids: ["pattern:forms"],
    tags: ["label", "helper-text", "field-label"],
    intent_labels: ["field-support", "form-label"],
  },
  loading: {
    category_ids: ["category:feedback"],
    pattern_ids: ["pattern:feedback", "pattern:empty-states"],
    tags: ["loading", "spinner", "progress"],
    intent_labels: ["async-state", "busy-state"],
  },
  popover: {
    category_ids: ["category:overlays"],
    pattern_ids: ["pattern:overlays"],
    tags: ["popover", "panel", "overlay"],
    intent_labels: ["contextual-surface", "floating-panel", "modal-lite"],
  },
  "progress-bar": {
    category_ids: ["category:feedback"],
    pattern_ids: ["pattern:feedback"],
    tags: ["progress", "loading", "status"],
    intent_labels: ["progress-indicator", "upload-status"],
  },
  "progress-circle": {
    category_ids: ["category:feedback"],
    pattern_ids: ["pattern:feedback"],
    tags: ["progress", "loading", "status", "circular"],
    intent_labels: ["progress-indicator", "completion"],
  },
  "radio-group": {
    category_ids: ["category:selection"],
    pattern_ids: ["pattern:forms"],
    tags: ["radio", "single-select", "group"],
    intent_labels: ["single-choice", "preference"],
  },
  select: {
    category_ids: ["category:selection", "category:overlays"],
    pattern_ids: ["pattern:forms", "pattern:overlays"],
    tags: ["select", "dropdown", "picker"],
    intent_labels: ["single-select", "picker", "chooser"],
  },
  slider: {
    category_ids: ["category:selection"],
    pattern_ids: ["pattern:forms"],
    tags: ["slider", "range", "scrubber"],
    intent_labels: ["range-selection", "adjustment"],
  },
  switch: {
    category_ids: ["category:selection"],
    pattern_ids: ["pattern:forms"],
    tags: ["switch", "toggle", "boolean"],
    intent_labels: ["toggle-control", "settings"],
  },
  "switch-group": {
    category_ids: ["category:selection"],
    pattern_ids: ["pattern:forms"],
    tags: ["switch-group", "toggle", "group"],
    intent_labels: ["group-toggle", "settings"],
  },
  tabs: {
    category_ids: ["category:navigation"],
    pattern_ids: ["pattern:navigation"],
    tags: ["tabs", "navigation", "segmented"],
    intent_labels: ["section-navigation", "content-switcher"],
  },
  tag: {
    category_ids: ["category:display"],
    pattern_ids: ["pattern:feedback"],
    tags: ["tag", "chip", "label"],
    intent_labels: ["categorization", "status-chip"],
  },
  textarea: {
    category_ids: ["category:inputs"],
    pattern_ids: ["pattern:forms"],
    tags: ["textarea", "multiline", "field"],
    intent_labels: ["long-form-entry", "comment-box"],
  },
  toggle: {
    category_ids: ["category:selection"],
    pattern_ids: ["pattern:forms"],
    tags: ["toggle", "pressed", "binary"],
    intent_labels: ["toggle-control", "formatting"],
  },
  "toggle-group": {
    category_ids: ["category:selection", "category:navigation"],
    pattern_ids: ["pattern:forms", "pattern:navigation"],
    tags: ["toggle-group", "segmented", "formatting"],
    intent_labels: ["multi-toggle", "segmented-control"],
  },
  tooltip: {
    category_ids: ["category:overlays"],
    pattern_ids: ["pattern:overlays"],
    tags: ["tooltip", "hint", "overlay"],
    intent_labels: ["microcopy", "hover-help"],
  },
};

export const get_categories = () => [...category_definitions];

export const build_patterns = (component_ids_by_slug: Map<string, string>) =>
  pattern_definitions.map<CatalogPattern>((pattern) => ({
    entry_type: "pattern",
    pattern_id: pattern.pattern_id,
    name: pattern.name,
    display_name: pattern.display_name,
    category_id: pattern.category_id,
    description: pattern.description,
    tags: pattern.tags,
    component_ids: pattern.component_slugs
      .map((slug) => component_ids_by_slug.get(slug))
      .filter((value): value is string => Boolean(value)),
    search_text: [
      pattern.display_name,
      pattern.description,
      ...pattern.tags,
      ...pattern.component_slugs,
    ].join(" "),
  }));

export const get_component_taxonomy = (
  component_name: string,
  description: string
): ComponentTaxonomy => {
  const slug = slugify(component_name);
  const base = component_taxonomy[slug] ?? {
    category_ids: ["category:display"],
    pattern_ids: [],
    tags: [slug],
    intent_labels: [slug],
  };

  const inferred = [
    ...base.tags,
    ...description
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) =>
        [
          "dropdown",
          "modal",
          "table",
          "form",
          "error",
          "search",
          "navigation",
          "overlay",
          "danger",
          "surface",
          "brand",
          "dark",
        ].includes(word)
      ),
  ];

  return {
    category_ids: base.category_ids,
    pattern_ids: base.pattern_ids,
    tags: Array.from(new Set(inferred)),
    intent_labels: Array.from(new Set(base.intent_labels)),
  };
};

export const classify_dependency = (specifier: string) => {
  if (specifier.startsWith("@radix-ui/") || specifier.startsWith("@headlessui/")) {
    return "headless" as const;
  }

  if (specifier.startsWith("@iconicicons/")) {
    return "icons" as const;
  }

  if (
    specifier === "clsx" ||
    specifier === "cva" ||
    specifier === "tailwind-merge" ||
    specifier === "deepmerge"
  ) {
    return "css-utility" as const;
  }

  if (specifier.startsWith("@testing-library/") || specifier === "@jest/globals") {
    return "testing" as const;
  }

  if (specifier === "react" || specifier.startsWith("react/")) {
    return "runtime" as const;
  }

  return "other" as const;
};

export const get_theme_aliases = (theme: string, color_name: string, scale: string) => {
  const alias_map: Record<string, string[]> = {
    "background.DEFAULT": ["color.background", "color.bg.canvas", `theme.${theme}.background`],
    "foreground.DEFAULT": ["color.foreground", "color.text.default", `theme.${theme}.foreground`],
    "primary.DEFAULT": ["color.action.primary", "color.brand.primary", "brand-primary"],
    "secondary.DEFAULT": ["color.action.secondary"],
    "surface.DEFAULT": ["color.bg.surface", "surface"],
    "surface.overlay": ["color.bg.overlay", "overlay"],
    "surface.overlay-foreground": ["color.text.overlay", "overlay-foreground"],
    "surface.overlay-focus": ["color.border.overlay-focus", "overlay-focus"],
    "destructive.DEFAULT": ["color.action.danger", "danger"],
  };

  const key = `${color_name}.${scale}`;
  const aliases = alias_map[key] ?? [`color.${color_name}.${scale}`];

  return Array.from(new Set([...aliases, `theme.${theme}.${color_name}.${scale}`]));
};
