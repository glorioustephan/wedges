/** @jest-environment node */

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { CatalogSearchService } from "./service.js";

describe("ui-builder search service", () => {
  let service: CatalogSearchService | undefined;

  beforeAll(async () => {
    service = await CatalogSearchService.create();
  });

  afterAll(async () => {
    await service?.close();
  });

  it("returns a compact build card for a known component", async () => {
    const card = await service!.get_component_card("button");

    expect(card?.entry_type).toBe("component-card");
    expect(card?.display_name).toBe("Button");
    expect(card?.primary_props.length).toBeGreaterThan(0);
    expect(card?.examples.length).toBeGreaterThan(0);
  });

  it("returns a recommendation with alternatives", async () => {
    const result = await service!.recommend_component({
      query: "which button should we use?",
      limit: 3,
    });

    expect(result.status).toBe("ok");
    expect(result.recommendation?.display_name).toBe("Button");
    expect(result.alternatives.length).toBeGreaterThanOrEqual(0);
  });

  it("builds a page context bundle", async () => {
    const context = await service!.build_ui_context({
      query: "build a settings form",
      limit: 3,
    });

    expect(context.query).toBe("build a settings form");
    expect(context.recommendation).toBeDefined();
    expect(context.clarification).toContain("settings form");
    expect(context.composition_steps.length).toBeGreaterThan(0);
    expect(context.patterns.length).toBeGreaterThan(0);
  });
});
