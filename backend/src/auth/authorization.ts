import type {
  User,
  UserRole,
} from "../generated/prisma/client";

import { AppError } from "../errors/app-error";
import type { GraphQLContext } from "./auth.types";

export function requireAuthenticatedUser(
  context: GraphQLContext,
): User {
  if (!context.user) {
    throw new AppError(
      "UNAUTHORIZED",
      "Authentication is required",
    );
  }

  return context.user;
}

export function requireRole(
  context: GraphQLContext,
  role: UserRole,
): User {
  const user = requireAuthenticatedUser(context);

  if (user.role !== role) {
    throw new AppError(
      "FORBIDDEN",
      "You do not have permission to perform this action",
    );
  }

  return user;
}