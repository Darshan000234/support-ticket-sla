import type { User } from "../generated/prisma/client";

export interface GraphQLContext {
  user: User | null;
}