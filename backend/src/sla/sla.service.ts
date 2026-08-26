import { DateTime } from "luxon";
import type { Priority } from "../generated/prisma/client";
import { AppError } from "../errors/app-error";

import { prisma } from "../db";
import {
  createBusinessCalendar,
  type BusinessCalendar,
} from "./business-calendar";
import {
  addBusinessMinutes,
  calculateSlaClock,
} from "./sla-calculator";
import { getSlaPolicy } from "./sla-policy";

const BUSINESS_TIMEZONE =
  process.env.BUSINESS_TIMEZONE ??
  "Asia/Kolkata";

async function getBusinessCalendar(): Promise<BusinessCalendar> {
  const holidays = await prisma.holiday.findMany();

  return createBusinessCalendar(
    BUSINESS_TIMEZONE,
    holidays.map((holiday) => ({
      date: DateTime.fromJSDate(
        holiday.date,
        {
          zone: BUSINESS_TIMEZONE,
        },
      ),
      name: holiday.name,
    })),
  );
}

export async function calculateTicketDeadlines(
  createdAt: Date,
  priority: Priority,
): Promise<{
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
}> {
  const calendar =
    await getBusinessCalendar();

  const policy = getSlaPolicy(priority);

  const createdDateTime =
    DateTime.fromJSDate(createdAt, {
      zone: BUSINESS_TIMEZONE,
    });

  const firstResponseDue =
    addBusinessMinutes(
      createdDateTime,
      policy.firstResponseMinutes,
      calendar,
    );

  const resolutionDue =
    addBusinessMinutes(
      createdDateTime,
      policy.resolutionMinutes,
      calendar,
    );

  return {
    firstResponseDueAt:
      firstResponseDue.toUTC().toJSDate(),

    resolutionDueAt:
      resolutionDue.toUTC().toJSDate(),
  };
}

export interface TicketSlaInfo {
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
  firstResponseState:
    | "ON_TRACK"
    | "AT_RISK"
    | "BREACHED";
  resolutionState:
    | "ON_TRACK"
    | "AT_RISK"
    | "BREACHED";
  firstResponseRemainingMinutes: number;
  resolutionRemainingMinutes: number;
}

export async function getTicketSlaInfo(
  ticket: {
    createdAt: Date;
    firstResponseDueAt: Date | null;
    resolutionDueAt: Date | null;
    firstResponseAt: Date | null;
    resolvedAt: Date | null;
    priority: Priority;
  },
): Promise<TicketSlaInfo> {
  if (
    !ticket.firstResponseDueAt ||
    !ticket.resolutionDueAt
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "SLA deadlines are missing",
    );
  }

  const calendar =
    await getBusinessCalendar();

  const policy =
    getSlaPolicy(ticket.priority);

  const createdAt =
    DateTime.fromJSDate(
      ticket.createdAt,
      {
        zone: BUSINESS_TIMEZONE,
      },
    );

  const firstResponseClock =
    calculateSlaClock(
      createdAt,
      DateTime.fromJSDate(
        ticket.firstResponseDueAt,
        {
          zone: BUSINESS_TIMEZONE,
        },
      ),
      policy.firstResponseMinutes,
      ticket.firstResponseAt
        ? DateTime.fromJSDate(
            ticket.firstResponseAt,
            {
              zone: BUSINESS_TIMEZONE,
            },
          )
        : null,
      DateTime.now().setZone(
        BUSINESS_TIMEZONE,
      ),
      calendar,
    );

  const resolutionClock =
    calculateSlaClock(
      createdAt,
      DateTime.fromJSDate(
        ticket.resolutionDueAt,
        {
          zone: BUSINESS_TIMEZONE,
        },
      ),
      policy.resolutionMinutes,
      ticket.resolvedAt
        ? DateTime.fromJSDate(
            ticket.resolvedAt,
            {
              zone: BUSINESS_TIMEZONE,
            },
          )
        : null,
      DateTime.now().setZone(
        BUSINESS_TIMEZONE,
      ),
      calendar,
    );

  return {
    firstResponseDueAt:
      ticket.firstResponseDueAt,

    resolutionDueAt:
      ticket.resolutionDueAt,

    firstResponseState:
      firstResponseClock.state,

    resolutionState:
      resolutionClock.state,

    firstResponseRemainingMinutes:
      firstResponseClock.remainingMinutes,

    resolutionRemainingMinutes:
      resolutionClock.remainingMinutes,
  };
}