import { DateTime } from "luxon";

export interface Holiday {
  date: DateTime;
  name: string;
}

export interface BusinessCalendar {
  timezone: string;
  startHour: number;
  endHour: number;
  holidays: Set<string>;
}

export function createBusinessCalendar(
  timezone: string,
  holidays: Holiday[],
): BusinessCalendar {
  const holidayDates = holidays
    .map((holiday) =>
      holiday.date
        .setZone(timezone)
        .toISODate(),
    )
    .filter(
      (date): date is string => date !== null,
    );

  return {
    timezone,
    startHour: 9,
    endHour: 18,
    holidays: new Set(holidayDates),
  };
}

export function isWeekend(
  date: DateTime,
): boolean {
  return date.weekday === 6 || date.weekday === 7;
}

export function isHoliday(
  date: DateTime,
  calendar: BusinessCalendar,
): boolean {
  const dateKey = date.toISODate();

  return (
    dateKey !== null &&
    calendar.holidays.has(dateKey)
  );
}

export function isBusinessDay(
  date: DateTime,
  calendar: BusinessCalendar,
): boolean {
  return (
    !isWeekend(date) &&
    !isHoliday(date, calendar)
  );
}