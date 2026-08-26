import { DateTime } from "luxon";
import {
  type BusinessCalendar,
  isBusinessDay,
} from "./business-calendar";
import {
  getBusinessEnd,
  normalizeToBusinessTime,
} from "./business-hours.ts";

export function addBusinessMinutes(
  start: DateTime,
  minutesToAdd: number,
  calendar: BusinessCalendar,
): DateTime {
  if (!start.isValid) {
    throw new Error("start must be a valid DateTime");
  }

  if (!Number.isFinite(minutesToAdd)) {
    throw new Error(
      "minutesToAdd must be a finite number",
    );
  }

  if (minutesToAdd < 0) {
    throw new Error(
      "minutesToAdd must be non-negative",
    );
  }

  let current = normalizeToBusinessTime(
    start,
    calendar,
  );

  let remaining = minutesToAdd;

  while (remaining > 0) {
    const businessEnd = getBusinessEnd(
      current,
      calendar,
    );

    const availableMinutes = Math.floor(
      businessEnd.diff(
        current,
        "minutes",
      ).minutes,
    );

    if (remaining <= availableMinutes) {
      return current.plus({
        minutes: remaining,
      });
    }

    remaining -= availableMinutes;

    current = current
      .plus({ days: 1 })
      .startOf("day");

    while (!isBusinessDay(current, calendar)) {
      current = current.plus({ days: 1 });
    }

    current = normalizeToBusinessTime(
      current,
      calendar,
    );
  }

  return current;
}

export function businessMinutesBetween(
  start: DateTime,
  end: DateTime,
  calendar: BusinessCalendar,
): number {
  if (end <= start) {
    return 0;
  }

  let current = normalizeToBusinessTime(
    start,
    calendar,
  );

  const final = end.setZone(
    calendar.timezone,
  );

  let totalMinutes = 0;

  while (current < final) {
    if (!isBusinessDay(current, calendar)) {
      current = current
        .plus({ days: 1 })
        .startOf("day");

      continue;
    }

    const businessEnd = getBusinessEnd(
      current,
      calendar,
    );

    const periodEnd =
      final < businessEnd
        ? final
        : businessEnd;

    if (periodEnd > current) {
      totalMinutes += periodEnd.diff(
        current,
        "minutes",
      ).minutes;
    }

    if (final <= businessEnd) {
      break;
    }

    current = current
      .plus({ days: 1 })
      .startOf("day");

    while (!isBusinessDay(current, calendar)) {
      current = current.plus({ days: 1 });
    }

    current = normalizeToBusinessTime(
      current,
      calendar,
    );
  }

  return Math.floor(totalMinutes);
}

export type SlaState =
  | "ON_TRACK"
  | "AT_RISK"
  | "BREACHED";

export interface SlaClockResult {
  state: SlaState;
  remainingMinutes: number;
}

export function calculateSlaClock(
  start: DateTime,
  dueAt: DateTime,
  budgetMinutes: number,
  completedAt: DateTime | null,
  now: DateTime,
  calendar: BusinessCalendar,
): SlaClockResult {
  const effectiveNow = now.setZone(
    calendar.timezone,
  );

  /*
   * Once the SLA event happens, its clock freezes.
   */
  if (completedAt) {
    const completed = completedAt.setZone(
      calendar.timezone,
    );

    const completedBusinessMinutes =
      businessMinutesBetween(
        start,
        completed,
        calendar,
      );

    const remainingMinutes = Math.max(
      budgetMinutes - completedBusinessMinutes,
      0,
    );

    return {
      state:
        completed > dueAt
          ? "BREACHED"
          : "ON_TRACK",
      remainingMinutes,
    };
  }

  if (effectiveNow >= dueAt) {
    return {
      state: "BREACHED",
      remainingMinutes: 0,
    };
  }

  const elapsedMinutes =
    businessMinutesBetween(
      start,
      effectiveNow,
      calendar,
    );

  const consumedRatio =
    elapsedMinutes / budgetMinutes;

  const state =
    consumedRatio > 0.75
      ? "AT_RISK"
      : "ON_TRACK";

  return {
    state,
    remainingMinutes: Math.max(
      budgetMinutes - elapsedMinutes,
      0,
    ),
  };
}