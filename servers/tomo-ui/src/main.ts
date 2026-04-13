import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { ensure_runtime_database } from "./db/build-db.js";
import { create_mcp_server } from "./mcp/server.js";
import { CatalogSearchService } from "./search/service.js";

const main = async () => {
  await ensure_runtime_database();
  const service = await CatalogSearchService.create();
  const server = create_mcp_server(service);
  const transport = new StdioServerTransport();

  process.on("SIGINT", async () => {
    await service.close();
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await service.close();
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
};

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
