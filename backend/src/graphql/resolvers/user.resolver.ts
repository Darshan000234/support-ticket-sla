import type {
  UserRole,
} from "../../generated/prisma/client";

import type {
  GraphQLContext,
} from "../../auth/auth.types";

import {
  requireAuthenticatedUser,
} from "../../auth/authorization";

import {
  listUsers,
} from "../../users/user.service";

export const userResolvers = {
  Query: {
    users: async (
      _parent: unknown,
      args: {
        role?: UserRole;
      },
      context: GraphQLContext,
    ) => {
      requireAuthenticatedUser(context);

      return listUsers(args.role);
    },
  },
};