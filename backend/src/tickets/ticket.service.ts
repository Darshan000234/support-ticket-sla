import {
  Priority,
  TicketStatus,
  type Prisma,
} from "../generated/prisma/client";
import {
  calculateTicketDeadlines,
} from "../sla/sla.service";
import { prisma } from "../db";
import { AppError } from "../errors/app-error";
import { validateStatusTransition } from "./ticket.rules";
import {
  decodeCursor,
  encodeCursor,
} from "./cursor";

import {
  getTicketSlaInfo,
} from "../sla/sla.service";


const ticketInclude = {
  reporter: true,
  assignee: true,
  comments: {
    orderBy: {
      createdAt: "asc",
    },
    include: {
      author: true,
    },
  },
} satisfies Prisma.TicketInclude;

type TicketWithRelations = Prisma.TicketGetPayload<{
  include: typeof ticketInclude;
}>;

function validateText(
  value: string,
  fieldName: string,
): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `${fieldName} cannot be empty`,
    );
  }

  return trimmed;
}

export async function createTicket(
  reporterId: string,
  title: string,
  description: string,
  priority: Priority,
): Promise<TicketWithRelations> {
  const cleanTitle =
    validateText(title, "Title");

  const cleanDescription =
    validateText(
      description,
      "Description",
    );

  const reporter =
    await prisma.user.findUnique({
      where: {
        id: reporterId,
      },
    });

  if (!reporter) {
    throw new AppError(
      "USER_NOT_FOUND",
      "Reporter was not found",
    );
  }

  const createdAt = new Date();

  const deadlines =
    await calculateTicketDeadlines(
      createdAt,
      priority,
    );

  return prisma.ticket.create({
    data: {
      title: cleanTitle,
      description: cleanDescription,
      priority,
      status: TicketStatus.OPEN,
      reporterId,

      createdAt,

      firstResponseDueAt:
        deadlines.firstResponseDueAt,

      resolutionDueAt:
        deadlines.resolutionDueAt,
    },

    include: ticketInclude,
  });
}

export async function getTicketById(
  ticketId: string,
): Promise<TicketWithRelations> {
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: ticketId,
    },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new AppError(
      "TICKET_NOT_FOUND",
      "Ticket was not found",
    );
  }

  return ticket;
}

export async function assignTicket(
  ticketId: string,
  assigneeId: string,
): Promise<TicketWithRelations> {
  await getTicketById(ticketId);

  const assignee = await prisma.user.findUnique({
    where: {
      id: assigneeId,
    },
  });

  if (!assignee) {
    throw new AppError(
      "USER_NOT_FOUND",
      "Assignee was not found",
    );
  }

  if (assignee.role !== "AGENT") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Ticket can only be assigned to an agent",
    );
  }

  return prisma.ticket.update({
    where: {
      id: ticketId,
    },
    data: {
      assigneeId,
    },
    include: ticketInclude,
  });
}

export async function changeTicketStatus(
  ticketId: string,
  nextStatus: TicketStatus,
): Promise<TicketWithRelations> {
  const ticket = await getTicketById(ticketId);

  validateStatusTransition(
    ticket.status,
    nextStatus,
  );

  const resolvedAt =
    nextStatus === TicketStatus.RESOLVED
      ? new Date()
      : undefined;

  return prisma.ticket.update({
    where: {
      id: ticketId,
    },
    data: {
      status: nextStatus,
      ...(resolvedAt
        ? {
          resolvedAt,
        }
        : {}),
    },
    include: ticketInclude,
  });
}

export async function resolveTicket(
  ticketId: string,
): Promise<TicketWithRelations> {
  return changeTicketStatus(
    ticketId,
    TicketStatus.RESOLVED,
  );
}

export async function addComment(
  ticketId: string,
  authorId: string,
  content: string,
): Promise<TicketWithRelations["comments"][number]> {
  const cleanContent = validateText(
    content,
    "Comment",
  );

  const ticket = await prisma.ticket.findUnique({
    where: {
      id: ticketId,
    },
  });

  if (!ticket) {
    throw new AppError(
      "TICKET_NOT_FOUND",
      "Ticket was not found",
    );
  }

  const author = await prisma.user.findUnique({
    where: {
      id: authorId,
    },
  });

  if (!author) {
    throw new AppError(
      "USER_NOT_FOUND",
      "Comment author was not found",
    );
  }

  const now = new Date();

  const result = await prisma.$transaction(
    async (tx) => {
      const comment = await tx.comment.create({
        data: {
          content: cleanContent,
          ticketId,
          authorId,
          createdAt: now,
        },
        include: {
          author: true,
        },
      });

      /*
       * The first comment by someone other than the
       * reporter starts the first-response clock.
       *
       * We only update when firstResponseAt is still null.
       * This prevents later comments from overwriting it.
       */
      if (authorId !== ticket.reporterId) {
        await tx.ticket.updateMany({
          where: {
            id: ticketId,
            firstResponseAt: null,
          },
          data: {
            firstResponseAt: now,
          },
        });
      }

      return comment;
    },
  );

  return result;
}

export interface ListTicketsInput {
  status?: TicketStatus;
  priority?: Priority;
  assigneeId?: string;
  slaState?: "ON_TRACK" | "AT_RISK" | "BREACHED";
  take?: number;
  cursor?: string;
}

export interface TicketConnectionResult {
  nodes: TicketWithRelations[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export async function listTickets(
  input: ListTicketsInput,
): Promise<TicketConnectionResult> {
  const requestedTake = input.take ?? 10;

  const take = Math.min(
    Math.max(requestedTake, 1),
    50,
  );

  const where: Prisma.TicketWhereInput = {
    ...(input.status
      ? { status: input.status }
      : {}),

    ...(input.priority
      ? { priority: input.priority }
      : {}),

    ...(input.assigneeId
      ? { assigneeId: input.assigneeId }
      : {}),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  let filtered = tickets;

  if (input.slaState) {
    const slaResults = await Promise.all(
      tickets.map(async (ticket) => {
        const sla = await getTicketSlaInfo(ticket);

        return {
          ticket,
          sla,
        };
      }),
    );

    filtered = slaResults
      .filter(({ sla }) => {
        let primaryState:
          | "ON_TRACK"
          | "AT_RISK"
          | "BREACHED";

        if (
          sla.firstResponseState === "BREACHED" ||
          sla.resolutionState === "BREACHED"
        ) {
          primaryState = "BREACHED";
        } else if (
          sla.firstResponseState === "AT_RISK" ||
          sla.resolutionState === "AT_RISK"
        ) {
          primaryState = "AT_RISK";
        } else {
          primaryState = "ON_TRACK";
        }

        return primaryState === input.slaState;
      })
      .map(({ ticket }) => ticket);
  }

  let startIndex = 0;

  if (input.cursor) {
    const cursorId =
      decodeCursor(input.cursor);

    const index = filtered.findIndex(
      (ticket) =>
        ticket.id === cursorId,
    );

    if (index >= 0) {
      startIndex = index + 1;
    }
  }

  const page = filtered.slice(
    startIndex,
    startIndex + take + 1,
  );

  const hasNextPage =
    page.length > take;

  const nodes = hasNextPage
    ? page.slice(0, take)
    : page;

  const lastNode =
    nodes[nodes.length - 1];

  return {
    nodes,
    pageInfo: {
      hasNextPage,
      endCursor: lastNode
        ? encodeCursor(lastNode.id)
        : null,
    },
  };
}

export interface TicketDashboard {
  openTickets: number;
  inProgressTickets: number;
  atRiskTickets: number;
  breachedTickets: number;
}

export async function getDashboard(): Promise<TicketDashboard> {
  const [
    openTickets,
    inProgressTickets,
    tickets,
  ] = await Promise.all([
    prisma.ticket.count({
      where: {
        status: "OPEN",
      },
    }),

    prisma.ticket.count({
      where: {
        status: "IN_PROGRESS",
      },
    }),

    prisma.ticket.findMany({
      include: ticketInclude,
    }),
  ]);

  let atRiskTickets = 0;
  let breachedTickets = 0;

  for (const ticket of tickets) {
    const sla = await getTicketSlaInfo(ticket);

    if (
      sla.firstResponseState === "AT_RISK" ||
      sla.resolutionState === "AT_RISK"
    ) {
      atRiskTickets += 1;
    }

    if (
      sla.firstResponseState === "BREACHED" ||
      sla.resolutionState === "BREACHED"
    ) {
      breachedTickets += 1;
    }
  }

  return {
    openTickets,
    inProgressTickets,
    atRiskTickets,
    breachedTickets,
  };
}