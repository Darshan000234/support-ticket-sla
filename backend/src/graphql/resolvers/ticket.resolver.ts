import {
  UserRole,
  type Priority,
  type TicketStatus,
} from "../../generated/prisma/client";

import type { GraphQLContext } from "../../auth/auth.types";

import {
  requireAuthenticatedUser,
  requireRole,
} from "../../auth/authorization";

import { AppError } from "../../errors/app-error";

import {
  addComment,
  assignTicket,
  changeTicketStatus,
  createTicket,
  getDashboard,
  getTicketById,
  listTickets,
  resolveTicket,
} from "../../tickets/ticket.service";

import { getTicketSlaInfo } from "../../sla/sla.service";

interface CreateTicketArgs {
  title: string;
  description: string;
  priority: Priority;
}

interface TicketIdArgs {
  id: string;
}

interface AssignTicketArgs {
  ticketId: string;
  assigneeId: string;
}

interface ChangeTicketStatusArgs {
  ticketId: string;
  status: TicketStatus;
}

interface AddCommentArgs {
  ticketId: string;
  content: string;
}

interface ResolveTicketArgs {
  ticketId: string;
}

interface ListTicketsArgs {
  status?: TicketStatus;
  priority?: Priority;
  assigneeId?: string;
  slaState?: "ON_TRACK" | "AT_RISK" | "BREACHED";
  take?: number;
  cursor?: string;
}

export const ticketResolvers = {
  Ticket: {
    sla: async (ticket: {
      createdAt: Date;
      firstResponseDueAt: Date | null;
      resolutionDueAt: Date | null;
      firstResponseAt: Date | null;
      resolvedAt: Date | null;
      priority: Priority;
    }) => {
      return getTicketSlaInfo(ticket);
    },
  },

  Query: {
    ticket: async (
      _parent: unknown,
      args: TicketIdArgs,
      context: GraphQLContext,
    ) => {
      requireAuthenticatedUser(context);

      return getTicketById(args.id);
    },
    tickets: async (
      _parent: unknown,
      args: ListTicketsArgs,
      context: GraphQLContext,
    ) => {
      requireAuthenticatedUser(context);

      return listTickets(args);
    },
    dashboard: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireAuthenticatedUser(context);

      return getDashboard();
    },
  },

  Mutation: {
    createTicket: async (
      _parent: unknown,
      args: CreateTicketArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuthenticatedUser(context);

      return createTicket(
        user.id,
        args.title,
        args.description,
        args.priority,
      );
    },

    assignTicket: async (
      _parent: unknown,
      args: AssignTicketArgs,
      context: GraphQLContext,
    ) => {
      requireRole(context, UserRole.AGENT);

      return assignTicket(
        args.ticketId,
        args.assigneeId,
      );
    },

    changeTicketStatus: async (
      _parent: unknown,
      args: ChangeTicketStatusArgs,
      context: GraphQLContext,
    ) => {
      requireRole(context, UserRole.AGENT);

      return changeTicketStatus(
        args.ticketId,
        args.status,
      );
    },

    addComment: async (
      _parent: unknown,
      args: AddCommentArgs,
      context: GraphQLContext,
    ) => {
      const user = requireAuthenticatedUser(context);

      /*
       * Agents can comment on any ticket.
       * Reporters can comment only on their own tickets.
       */
      if (user.role === UserRole.REPORTER) {
        const ticket = await getTicketById(args.ticketId);

        if (ticket.reporterId !== user.id) {
          throw new AppError(
            "FORBIDDEN",
            "Reporters can only comment on their own tickets",
          );
        }
      }

      return addComment(
        args.ticketId,
        user.id,
        args.content,
      );
    },

    resolveTicket: async (
      _parent: unknown,
      args: ResolveTicketArgs,
      context: GraphQLContext,
    ) => {
      requireRole(context, UserRole.AGENT);

      return resolveTicket(args.ticketId);
    },
  },
};