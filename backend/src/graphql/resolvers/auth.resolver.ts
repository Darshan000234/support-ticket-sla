import type { GraphQLContext } from "../../context";
import {
  loginUser,
  registerUser,
} from "../../auth/auth.service";

interface RegisterArgs {
  name: string;
  email: string;
  password: string;
  role: "REPORTER" | "AGENT";
}

interface LoginArgs {
  email: string;
  password: string;
}

export const authResolvers = {
  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      return context.user;
    },
  },

  Mutation: {
    register: async (
      _parent: unknown,
      args: RegisterArgs,
    ) => {
      return registerUser(
        args.name,
        args.email,
        args.password,
        args.role,
      );
    },

    login: async (
      _parent: unknown,
      args: LoginArgs,
    ) => {
      return loginUser(
        args.email,
        args.password,
      );
    },
  },
};