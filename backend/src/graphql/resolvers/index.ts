import { authResolvers } from "./auth.resolver";
import { ticketResolvers } from "./ticket.resolver";
import { dateTimeScalar } from "./date-time.scalar";

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...ticketResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...ticketResolvers.Mutation,
  },

  Ticket: {
    ...ticketResolvers.Ticket,
  },
};