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