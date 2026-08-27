import type { GraphQLContext } from "../../auth/auth.types";
import { requireAuthenticatedUser } from "../../auth/authorization";
import { listHolidays } from "../../holiday/holiday.service";

export const holidayResolvers = {
  Query: {
    holidays: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireAuthenticatedUser(context);

      return listHolidays();
    },
  },
};