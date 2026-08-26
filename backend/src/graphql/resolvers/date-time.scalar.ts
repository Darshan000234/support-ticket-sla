import {
  GraphQLScalarType,
  Kind,
  type ValueNode,
} from "graphql";

function parseDateValue(value: unknown): Date {
  if (typeof value !== "string") {
    throw new TypeError(
      "DateTime must be provided as an ISO string",
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      "Invalid DateTime value",
    );
  }

  return date;
}

function parseLiteralValue(
  ast: ValueNode,
): Date {
  if (ast.kind !== Kind.STRING) {
    throw new TypeError(
      "DateTime must be provided as an ISO string",
    );
  }

  return parseDateValue(ast.value);
}

export const dateTimeScalar =
  new GraphQLScalarType<Date, string>({
    name: "DateTime",

    serialize(value): string {
      if (!(value instanceof Date)) {
        throw new TypeError(
          "DateTime resolver expected a Date",
        );
      }

      return value.toISOString();
    },

    parseValue: parseDateValue,

    parseLiteral: parseLiteralValue,
  });