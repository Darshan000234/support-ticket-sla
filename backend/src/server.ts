import "dotenv/config";
import { createSchema, createYoga } from "graphql-yoga";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { resolvers } from "./graphql/resolvers";
import { createContext } from "./context";

const schemaDirectory = join(
  import.meta.dir,
  "graphql/schema",
);

const [commonSchema, authSchema, ticketSchema] =
  await Promise.all([
    readFile(
      join(schemaDirectory, "common.graphql"),
      "utf8",
    ),
    readFile(
      join(schemaDirectory, "auth.graphql"),
      "utf8",
    ),
    readFile(
      join(schemaDirectory, "ticket.graphql"),
      "utf8",
    ),
  ]);

const typeDefs = [
  commonSchema,
  authSchema,
  ticketSchema,
].join("\n");

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  context: ({ request }) => createContext(request),
});

const server = Bun.serve({
  port: 4000,
  fetch: yoga,
});

console.log(
  `GraphQL server running at http://localhost:${server.port}/graphql`,
);