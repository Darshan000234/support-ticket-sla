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

const ALLOWED_ORIGIN =
  "http://localhost:5173";

const server = Bun.serve({
  port: 4000,

  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":
            ALLOWED_ORIGIN,
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
          "Access-Control-Allow-Methods":
            "POST, OPTIONS",
        },
      });
    }

    const response =
      await yoga.fetch(request);

    const headers =
      new Headers(response.headers);

    headers.set(
      "Access-Control-Allow-Origin",
      ALLOWED_ORIGIN,
    );

    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    headers.set(
      "Access-Control-Allow-Methods",
      "POST, OPTIONS",
    );

    return new Response(
      response.body,
      {
        status: response.status,
        statusText:
          response.statusText,
        headers,
      },
    );
  },
});
console.log(
  `GraphQL server running at http://localhost:${server.port}/graphql`,
);