import type { CatalogComponent, CatalogToken } from "./contracts.js";

export type ComponentTokenLink = {
  component_id: string;
  token_id: string;
  relation: "uses";
};

export const link_component_tokens = (
  components: CatalogComponent[],
  tokens: CatalogToken[]
): ComponentTokenLink[] => {
  return components.flatMap((component) => {
    const searchable_utility = component.utility_classes.join(" ").toLowerCase();
    const searchable_text = `${searchable_utility} ${component.search_text.toLowerCase()}`;
    const linked = new Set<string>();

    tokens.forEach((token) => {
      const aliases = [token.name, token.raw_value, ...token.semantic_aliases]
        .map((value) => value.toLowerCase())
        .filter((value) => value.length >= 4 || token.kind === "z-index");
      const is_direct_utility =
        component.utility_classes.includes(token.name) || component.utility_classes.includes(token.raw_value);

      if (is_direct_utility) {
        linked.add(token.token_id);
        return;
      }

      if (
        aliases.some((alias) => searchable_utility.includes(alias)) ||
        aliases.some((alias) => searchable_text.includes(alias))
      ) {
        linked.add(token.token_id);
      }
    });

    return Array.from(linked).map((token_id) => ({
      component_id: component.component_id,
      token_id,
      relation: "uses" as const,
    }));
  });
};
