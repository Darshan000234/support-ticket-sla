import { GraphQLError } from "graphql";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "TICKET_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INVALID_STATUS_TRANSITION"
  | "INVALID_COMMENT"
  | "INVALID_PRIORITY";

export class AppError extends GraphQLError {
  constructor(code: ErrorCode, message: string) {
    super(message, {
      extensions: {
        code,
      },
    });
  }
}