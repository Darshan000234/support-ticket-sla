import { DateTime } from "luxon";
import {
  type BusinessCalendar,
  isBusinessDay,
} from "./business-calendar";

function moveToNextBusinessDay(
  date: DateTime,
  calendar: BusinessCalendar,
): DateTime {
  let current = date
    .setZone(calendar.timezone)
    .plus({ days: 1 })
    .startOf("day");

  while (!isBusinessDay(current, calendar)) {
    current = current.plus({ days: 1 });
  }

  return current;
}

export function getBusinessStart(
  date: DateTime,
  calendar: BusinessCalendar,
): DateTime {
  return date
    .setZone(calendar.timezone)
    .startOf("day")
    .set({
      hour: calendar.startHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
}

export function getBusinessEnd(
  date: DateTime,
  calendar: BusinessCalendar,
): DateTime {
  return date
    .setZone(calendar.timezone)
    .startOf("day")
    .set({
      hour: calendar.endHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
}

export function normalizeToBusinessTime(
  input: DateTime,
  calendar: BusinessCalendar,
): DateTime {
  let current: DateTime = input.setZone(calendar.timezone);
  
  while (true) {
    if (!isBusinessDay(current, calendar)) {
      current = moveToNextBusinessDay(
        current,
        calendar,
      );
      continue;
    }

    const businessStart = getBusinessStart(
      current,
      calendar,
    );

    const businessEnd = getBusinessEnd(
      current,
      calendar,
    );

    if (current < businessStart) {
      return businessStart;
    }

    if (current >= businessEnd) {
      current = moveToNextBusinessDay(
        current,
        calendar,
      );
      continue;
    }

    return current;
  }
}