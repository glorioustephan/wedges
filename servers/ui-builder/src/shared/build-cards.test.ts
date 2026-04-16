import { describe, expect, it } from "@jest/globals";

import type { CatalogComponent, CatalogToken } from "./contracts.js";
import { build_component_card, build_context_steps, compare_component_cards } from "./build-cards.js";

const makeToken = (overrides: Partial<CatalogToken> = {}): CatalogToken =>
  ({
    entry_type: "token",
    token_id: "token:color:light.surface.overlay-focus",
    name: "light.surface.overlay-focus",
    display_name: "Overlay Focus",
    kind: "color",
    raw_value: "oklch(0.95 0.02 255)",
    semantic_aliases: ["overlay-focus", "surface.overlay-focus"],
    tags: ["surface", "focus"],
    source_path: "packages/ui/src/tw-plugin/foundation/colors/themableColors.ts",
    description: "Overlay focus token.",
    modes: ["light"],
    search_text: "Overlay Focus overlay-focus surface.overlay-focus",
    ...overrides,
  }) as CatalogToken;

const makeComponent = (overrides: Partial<CatalogComponent> = {}): CatalogComponent =>
  ({
    entry_type: "component",
    component_id: "component:button",
    name: "button",
    display_name: "Button",
    framework: "react",
    status: "stable",
    category_ids: ["category:inputs"],
    pattern_ids: ["pattern:forms"],
    tags: ["action", "input"],
    intent_labels: ["primary action", "submit"],
    source_path: "packages/ui/src/components/Button/Button.tsx",
    description: "Primary action button used for form submissions and direct actions.",
    summary: "Primary action button.",
    slots: ["icon", "label"],
    props: [
      {
        name: "variant",
        type: '"solid" | "ghost"',
        required: false,
        default_value: "solid",
        description: "Visual treatment.",
        source: "docs",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        required: false,
        default_value: "md",
        description: "Control size.",
        source: "source",
      },
    ],
    variants: [
      {
        name: "variant",
        values: ["solid", "ghost"],
        source: "docs",
      },
    ],
    accessibility: {
      roles: ["button"],
      labels: ["Use a visible label"],
      keyboard_support: ["Enter activates", "Space activates"],
      notes: ["Use for primary actions."],
    },
    dependencies: [],
    utility_classes: ["rounded-md", "px-4", "py-2"],
    style_hooks: ["focus-visible:ring-2"],
    subcomponents: [
      {
        name: "Icon",
        local_name: "Icon",
        props: [
          {
            name: "name",
            type: "string",
            required: false,
            source: "story",
          },
        ],
      },
    ],
    examples: [
      {
        id: "button-basic",
        title: "Basic button",
        file_path: "packages/ui/src/components/Button/Button.stories.tsx",
        code: "export const Basic = () => <Button variant=\"solid\">Save changes</Button>;",
        source: "story",
      },
      {
        id: "button-submit",
        title: "Submit button",
        file_path: "packages/ui/src/components/Button/Button.examples.tsx",
        code:
          "export const Submit = () => <Button type=\"submit\" variant=\"solid\">Submit form</Button>;",
        source: "docs-example",
      },
    ],
    token_ids: ["token:color:light.surface.overlay-focus"],
    supported_themes: ["light", "dark"],
    search_text: "Button primary action submit variant size focus visible ring",
    family: "actions",
    ...overrides,
  }) as CatalogComponent;

describe("build cards", () => {
  it("materializes a compact build card with the right projections", () => {
    const component = makeComponent();
    const card = build_component_card(component, new Map([[component.token_ids[0]!, makeToken()]]));

    expect(card.entry_type).toBe("component-card");
    expect(card.primary_props).toHaveLength(2);
    expect(card.variant_groups).toHaveLength(1);
    expect(card.composition_order).toEqual(["slot: icon", "slot: label", "subcomponent: Icon"]);
    expect(card.examples).toHaveLength(2);
    expect(card.examples[0]!.snippet.length).toBeGreaterThan(0);
    expect(card.accessibility_notes).toContain("role: button");
    expect(card.linked_tokens[0]!.display_name).toBe("Overlay Focus");
    expect(card.style_signals.some((signal) => signal.style_value === "rounded-md")).toBe(true);
    expect(card.rationale).toContain("Button");
    expect(card.confidence).toBe(1);
  });

  it("compares shared and unique traits deterministically", () => {
    const token = makeToken();
    const primary = build_component_card(makeComponent(), new Map([[token.token_id, token]]));
    const secondary = build_component_card(
      makeComponent({
        component_id: "component:toggle",
        name: "toggle",
        display_name: "Toggle",
        summary: "Toggle switch.",
        description: "Toggle switch for binary state.",
        props: [
          {
            name: "checked",
            type: "boolean",
            required: false,
            source: "docs",
          },
        ],
        variants: [
          {
            name: "state",
            values: ["on", "off"],
            source: "story",
          },
        ],
        token_ids: [token.token_id],
      }),
      new Map([[token.token_id, token]])
    );

    const comparison = compare_component_cards([primary, secondary]);

    expect(comparison.shared.tokens).toEqual([token.token_id]);
    expect(comparison.shared.accessibility_notes).toContain("role: button");
    expect(comparison.items[0]!.unique_props).toContain("variant");
    expect(comparison.items[1]!.unique_props).toContain("checked");
  });

  it("builds composition steps from the card", () => {
    const token = makeToken();
    const card = build_component_card(makeComponent(), new Map([[token.token_id, token]]));
    const steps = build_context_steps(card);

    expect(steps[0]).toContain("Button");
    expect(steps.some((step) => step.includes("slot: icon"))).toBe(true);
    expect(steps.some((step) => step.includes("role: button"))).toBe(true);
  });
});
