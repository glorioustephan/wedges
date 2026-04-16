import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import { CatalogSearchService } from "../search/service.js";
import type { CatalogComponent } from "../shared/contracts.js";

const asText = (value: unknown) => JSON.stringify(value, null, 2);

const summarizeProps = (props: CatalogComponent["props"], limit = 4) =>
  props.slice(0, limit).map((prop) => ({
    name: prop.name,
    type: prop.type,
    required: prop.required,
    ...(prop.default_value ? { default_value: prop.default_value } : {}),
  }));

const summarizeVariants = (variants: CatalogComponent["variants"], limit = 4) =>
  variants.slice(0, limit).map((variant) => ({
    name: variant.name,
    values: variant.values,
  }));

const summarizeExamples = (examples: CatalogComponent["examples"], limit = 2) =>
  examples.slice(0, limit).map((example) => ({
    title: example.title,
    file_path: example.file_path,
    source: example.source,
  }));

const summarizeComponent = (component: CatalogComponent) => ({
  component_id: component.component_id,
  display_name: component.display_name,
  summary: component.summary,
  source_path: component.source_path,
  status: component.status,
  supported_themes: component.supported_themes,
  primary_props: summarizeProps(component.props),
  variant_groups: summarizeVariants(component.variants),
  subcomponents: component.subcomponents.map((subcomponent) => subcomponent.name),
  examples: summarizeExamples(component.examples),
});

const formatComponentResult = (
  result: {
    item: CatalogComponent;
    score: number;
    evidence?: Array<{ field: string; value: string; match_type: "exact" | "term" }>;
    rationale?: string;
    debug?: Record<string, number>;
  },
  debug: boolean
) => ({
  ...summarizeComponent(result.item),
  evidence: result.evidence,
  rationale: result.rationale,
  score: Number(result.score.toFixed(3)),
  ...(debug ? { debug: result.debug } : {}),
});

export const create_mcp_server = (service: CatalogSearchService) => {
  const server = new McpServer({
    name: "ui-builder",
    version: "0.1.0",
  });

  server.registerTool(
    "search_components",
    {
      title: "Search Components",
      description:
        "Search the UI component catalog by text, category, framework, theme, or status. Use recommend_component when you want one best answer.",
      inputSchema: {
        query: z.string().describe("Search text to match against the component catalog."),
        category: z.string().optional().describe("Optional category id or short name such as inputs."),
        framework: z.string().optional().describe("Optional framework filter."),
        theme: z.enum(["light", "dark"]).optional().describe("Optional theme filter."),
        status: z.enum(["stable", "preview", "deprecated"]).optional().describe("Optional component status filter."),
        limit: z.number().int().min(1).max(20).default(8).describe("Maximum number of results."),
        debug: z.boolean().default(false).describe("Include ranking breakdowns in each result."),
      },
    },
    async ({ category, debug, framework, limit, query, status, theme }) => {
      const results = await service.search_components({
        query,
        category,
        framework,
        theme,
        status,
        limit,
        debug,
      });

      return {
        content: [
          {
            type: "text",
            text: asText({
              total: results.total,
              results: results.results.map((result) => formatComponentResult(result, debug)),
            }),
          },
        ],
      };
    }
  );

  server.registerTool(
    "recommend_component",
    {
      title: "Recommend Component",
      description:
        "Return a compact best-match recommendation for questions like 'which button should we use?'.",
      inputSchema: {
        query: z.string().describe("Search text describing the UI need."),
        category: z.string().optional().describe("Optional category id or short name such as inputs."),
        framework: z.string().optional().describe("Optional framework filter."),
        theme: z.enum(["light", "dark"]).optional().describe("Optional theme filter."),
        status: z.enum(["stable", "preview", "deprecated"]).optional().describe("Optional component status filter."),
        limit: z.number().int().min(1).max(8).default(3).describe("Maximum number of returned matches."),
        debug: z.boolean().default(false).describe("Include ranking breakdowns in the response."),
      },
    },
    async ({ category, debug, framework, limit, query, status, theme }) => {
      const results = await service.recommend_component({
        query,
        category,
        framework,
        theme,
        status,
        limit,
        debug,
      });

      return {
        content: [
          {
            type: "text",
            text: asText(results),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_component_card",
    {
      title: "Get Component Card",
      description:
        "Fetch the compact build card for a component. Use this after recommend_component or when you already know the component you want.",
      inputSchema: {
        component_id: z.string().describe("The component id, canonical name, or display name to fetch."),
      },
    },
    async ({ component_id }) => {
      const card = await service.get_component_card(component_id);

      return {
        content: [
          {
            type: "text",
            text: asText(
              card ?? {
                error: `No compact component card found for ${component_id}.`,
              }
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "batch_get_components",
    {
      title: "Batch Get Components",
      description: "Fetch multiple compact component cards in a single call so agents can compare options quickly.",
      inputSchema: {
        component_ids: z.array(z.string()).min(1).max(12).describe("Component ids or canonical names to fetch."),
      },
    },
    async ({ component_ids }) => {
      const results = await service.batch_get_components(component_ids);

      return {
        content: [
          {
            type: "text",
            text: asText(results),
          },
        ],
      };
    }
  );

  server.registerTool(
    "compare_components",
    {
      title: "Compare Components",
      description:
        "Compare a small set of components side by side, including shared props, subcomponents, tokens, and style signals.",
      inputSchema: {
        component_ids: z.array(z.string()).min(2).max(8).describe("Component ids or canonical names to compare."),
        query: z.string().optional().describe("Optional task context to bias the comparison."),
      },
    },
    async ({ component_ids, query }) => {
      const results = await service.compare_components(component_ids, query);

      return {
        content: [
          {
            type: "text",
            text: asText(results),
          },
        ],
      };
    }
  );

  server.registerTool(
    "search_examples",
    {
      title: "Search Examples",
      description:
        "Search the smallest relevant usage examples directly instead of loading full docs or stories.",
      inputSchema: {
        query: z.string().describe("Search text to match against examples and example code."),
        component: z.string().optional().describe("Optional component id or canonical name filter."),
        limit: z.number().int().min(1).max(10).default(5).describe("Maximum number of results."),
        debug: z.boolean().default(false).describe("Include ranking breakdowns in each result."),
      },
    },
    async ({ component, debug, limit, query }) => {
      const results = await service.search_examples({
        query,
        component,
        limit,
        debug,
      });

      return {
        content: [
          {
            type: "text",
            text: asText(results),
          },
        ],
      };
    }
  );

  server.registerTool(
    "build_ui_context",
    {
      title: "Build UI Context",
      description:
        "Return the recommended component, close alternatives, relevant patterns, examples, and composition steps for a page-building task.",
      inputSchema: {
        query: z.string().describe("Task intent or UI requirement."),
        category: z.string().optional().describe("Optional category id or short name such as inputs."),
        framework: z.string().optional().describe("Optional framework filter."),
        theme: z.enum(["light", "dark"]).optional().describe("Optional theme filter."),
        status: z.enum(["stable", "preview", "deprecated"]).optional().describe("Optional component status filter."),
        limit: z.number().int().min(1).max(8).default(3).describe("Maximum number of returned matches."),
        debug: z.boolean().default(false).describe("Include ranking breakdowns in the response."),
      },
    },
    async ({ category, debug, framework, limit, query, status, theme }) => {
      const results = await service.build_ui_context({
        query,
        category,
        framework,
        theme,
        status,
        limit,
        debug,
      });

      return {
        content: [
          {
            type: "text",
            text: asText(results),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_component",
    {
      title: "Get Component",
      description:
        "Fetch the full component record by component id, canonical name, or display name. Use this after recommend_component if you need the complete implementation detail.",
      inputSchema: {
        component_id: z.string().describe("The component id or name to fetch."),
      },
    },
    async ({ component_id }) => {
      const component = await service.get_component(component_id);
      const related_tokens = component
        ? await service.list_component_tokens(component.component_id)
        : [];

      return {
        content: [
          {
            type: "text",
            text: asText(
              component
                ? {
                    ...component,
                    related_tokens: related_tokens.map((token) => ({
                      token_id: token.token_id,
                      display_name: token.display_name,
                      kind: token.kind,
                      raw_value: token.raw_value,
                      semantic_aliases: token.semantic_aliases,
                    })),
                  }
                : {
                    error: `No component found for ${component_id}.`,
                  }
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "search_patterns",
    {
      title: "Search Patterns",
      description: "Search higher-level UI patterns and compositions by text or intent.",
      inputSchema: {
        query: z.string().describe("Search text to match against UI patterns."),
        limit: z.number().int().min(1).max(20).default(8).describe("Maximum number of results."),
        debug: z.boolean().default(false).describe("Include ranking breakdowns in each result."),
      },
    },
    async ({ debug, limit, query }) => {
      const results = await service.search_patterns({
        query,
        limit,
        debug,
      });

      return {
        content: [
          {
            type: "text",
            text: asText({
              total: results.total,
              results: results.results.map((result) => ({
                pattern_id: result.item.pattern_id,
                display_name: result.item.display_name,
                category_id: result.item.category_id,
                tags: result.item.tags,
                component_ids: result.item.component_ids,
                description: result.item.description,
                evidence: result.evidence,
                rationale: result.rationale,
                score: Number(result.score.toFixed(3)),
                ...(debug ? { debug: result.debug } : {}),
              })),
            }),
          },
        ],
      };
    }
  );

  server.registerTool(
    "search_tokens",
    {
      title: "Search Tokens",
      description: "Search design tokens by raw value, semantic alias, kind, or mode.",
      inputSchema: {
        query: z.string().describe("Search text to match against tokens."),
        kind: z
          .enum(["color", "typography", "spacing", "radius", "shadow", "motion", "z-index"])
          .optional()
          .describe("Optional token kind filter."),
        mode: z.string().optional().describe("Optional mode filter such as light or dark."),
        limit: z.number().int().min(1).max(20).default(8).describe("Maximum number of results."),
        debug: z.boolean().default(false).describe("Include ranking breakdowns in each result."),
      },
    },
    async ({ debug, kind, limit, mode, query }) => {
      const results = await service.search_tokens({
        query,
        kind,
        mode,
        limit,
        debug,
      });

      return {
        content: [
          {
            type: "text",
            text: asText({
              total: results.total,
              results: results.results.map((result) => ({
                token_id: result.item.token_id,
                display_name: result.item.display_name,
                kind: result.item.kind,
                raw_value: result.item.raw_value,
                semantic_aliases: result.item.semantic_aliases,
                modes: result.item.modes,
                evidence: result.evidence,
                rationale: result.rationale,
                score: Number(result.score.toFixed(3)),
                ...(debug ? { debug: result.debug } : {}),
              })),
            }),
          },
        ],
      };
    }
  );

  server.registerTool(
    "search_styles",
    {
      title: "Search Styles",
      description: "Search component styling records including utility classes, hooks, and linked design tokens.",
      inputSchema: {
        query: z.string().describe("Search text to match against styling information."),
        component: z.string().optional().describe("Optional component id or display name filter."),
        style_kind: z
          .enum(["utility-class", "style-hook", "design-token"])
          .optional()
          .describe("Optional style record kind filter."),
        style_family: z.string().optional().describe("Optional style family filter such as color or spacing."),
        limit: z.number().int().min(1).max(20).default(8).describe("Maximum number of results."),
        debug: z.boolean().default(false).describe("Include ranking breakdowns in each result."),
      },
    },
    async ({ component, debug, limit, query, style_family, style_kind }) => {
      const results = await service.search_styles({
        query,
        component,
        style_kind,
        style_family,
        limit,
        debug,
      });

      return {
        content: [
          {
            type: "text",
            text: asText({
              total: results.total,
              results: results.results.map((result) => ({
                ...result.item,
                evidence: result.evidence,
                rationale: result.rationale,
                score: Number(result.score.toFixed(3)),
                ...(debug ? { debug: result.debug } : {}),
              })),
            }),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_token",
    {
      title: "Get Token",
      description: "Fetch a single token by token id, canonical name, or display name.",
      inputSchema: {
        token_id: z.string().describe("The token id or name to fetch."),
      },
    },
    async ({ token_id }) => {
      const token = await service.get_token(token_id);

      return {
        content: [
          {
            type: "text",
            text: asText(
              token ?? {
                error: `No token found for ${token_id}.`,
              }
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "list_categories",
    {
      title: "List Categories",
      description: "List the component categories available in the catalog.",
    },
    async () => {
      const categories = await service.list_categories();

      return {
        content: [
          {
            type: "text",
            text: asText(categories),
          },
        ],
      };
    }
  );

  server.registerTool(
    "find_by_dependency",
    {
      title: "Find By Dependency",
      description: "Find components that import a specific dependency.",
      inputSchema: {
        dependency: z.string().describe("Dependency specifier substring, such as @radix-ui/react-tabs."),
        limit: z.number().int().min(1).max(20).default(8).describe("Maximum number of results."),
      },
    },
    async ({ dependency, limit }) => {
      const components = await service.find_by_dependency(dependency, limit);

      return {
        content: [
          {
            type: "text",
            text: asText(
              components.map((component) => ({
                component_id: component.component_id,
                display_name: component.display_name,
                source_path: component.source_path,
                dependencies: component.dependencies,
              }))
            ),
          },
        ],
      };
    }
  );

  return server;
};
