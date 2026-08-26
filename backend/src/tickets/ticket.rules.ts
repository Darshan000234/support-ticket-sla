import type { TicketStatus } from "../generated/prisma/client";
import { AppError } from "../errors/app-error";

const allowedTransitions: Record<
  TicketStatus,
  TicketStatus[]
> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};

export function validateStatusTransition(
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
): void {
  const allowed = allowedTransitions[currentStatus];

  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      `Ticket cannot transition from ${currentStatus} to ${nextStatus}`,
    );
  }
}