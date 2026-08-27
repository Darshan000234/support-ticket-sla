import { authResolvers } from "./auth.resolver";
import { dateTimeScalar } from "./date-time.scalar";
import { holidayResolvers } from "./holiday.resolver";
import { ticketResolvers } from "./ticket.resolver";
import { userResolvers } from "./user.resolver";

export const resolvers = {
  DateTime: dateTimeScalar,

  Query: {
    ...authResolvers.Query,
    ...ticketResolvers.Query,
    ...userResolvers.Query,
    ...holidayResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...ticketResolvers.Mutation,
  },

  Ticket: {
    ...ticketResolvers.Ticket,
  },
};