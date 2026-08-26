import {
  describe,
  expect,
  test,
} from "bun:test";

import { DateTime } from "luxon";

import {
  createBusinessCalendar,
} from "../../src/sla/business-calendar";

import {
  addBusinessMinutes,
  businessMinutesBetween,
  calculateSlaClock,
} from "../../src/sla/sla-calculator";

const calendar = createBusinessCalendar(
  "Asia/Kolkata",
  [],
);

function dt(value: string): DateTime {
  return DateTime.fromISO(value, {
    zone: "Asia/Kolkata",
  });
}

describe("SLA Calculator", () => {
  test(
    "adds business minutes during a normal weekday",
    () => {
      const start = dt(
        "2026-08-24T10:00:00",
      );

      const result = addBusinessMinutes(
        start,
        120,
        calendar,
      );

      expect(result.toISO()).toBe(
        "2026-08-24T12:00:00.000+05:30",
      );
    },
  );

  test(
    "moves an after-hours ticket to the next business period",
    () => {
      const start = dt(
        "2026-08-24T20:00:00",
      );

      const result = addBusinessMinutes(
        start,
        60,
        calendar,
      );

      expect(result.toISO()).toBe(
        "2026-08-25T10:00:00.000+05:30",
      );
    },
  );

  test(
  "moves an after-hours ticket to the next business period",
  () => {
    const start =
      dt("2026-08-24T20:00:00");

    const result =
      addBusinessMinutes(
        start,
        60,
        calendar,
      );

    expect(result.toISO()).toBe(
      "2026-08-25T10:00:00.000+05:30",
    );
  },
);

test(
  "crosses a weekend correctly",
  () => {
    const start =
      dt("2026-08-21T17:00:00");

    const result =
      addBusinessMinutes(
        start,
        240,
        calendar,
      );

    expect(result.toISO()).toBe(
      "2026-08-24T12:00:00.000+05:30",
    );
  },
);
test(
  "skips configured holidays",
  () => {
    const start =
      dt("2026-08-23T12:00:00");

    const result =
      addBusinessMinutes(
        start,
        60,
        holidayCalendar,
      );

    expect(result.toISO()).toBe(
      "2026-08-25T10:00:00.000+05:30",
    );
  },
);
test(
  "skips configured holidays",
  () => {
    const start =
      dt("2026-08-23T12:00:00");

    const result =
      addBusinessMinutes(
        start,
        60,
        holidayCalendar,
      );

    expect(result.toISO()).toBe(
      "2026-08-25T10:00:00.000+05:30",
    );
  },
);
});

const holidayCalendar =
  createBusinessCalendar(
    "Asia/Kolkata",
    [
      {
        date: dt("2026-08-24T00:00:00"),
        name: "Test Holiday",
      },
    ],
  );