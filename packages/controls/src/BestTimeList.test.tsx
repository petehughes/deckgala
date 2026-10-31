import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BestTimeList, type PersonalBestRecord } from "./BestTimeList";
import { convertPoolCourseTime, formatSwimTime } from "./swim-conversions";

const mockRecords: PersonalBestRecord[] = [
  {
    id: "pb-1",
    stroke: "FREESTYLE",
    distance: 50,
    course: "SHORT_COURSE_METERS",
    timeMs: 25400,
    achievedAt: "2026-05-12T00:00:00.000Z",
    meetName: "County Championships 2026",
    timingLevel: "NATIONAL",
  },
  {
    id: "pb-2",
    stroke: "FREESTYLE",
    distance: 100,
    course: "SHORT_COURSE_METERS",
    timeMs: 56200,
    achievedAt: "2026-04-10T00:00:00.000Z",
    meetName: "Spring Open Meet",
    timingLevel: "REGIONAL",
  },
  {
    id: "pb-3",
    stroke: "BACKSTROKE",
    distance: 100,
    course: "LONG_COURSE_METERS",
    timeMs: 65100,
    achievedAt: "2026-06-20T00:00:00.000Z",
    meetName: "Regional LC Championships",
    timingLevel: "COUNTY",
  },
];

describe("BestTimeList Component", () => {
  test("renders grid matrix layout by default with stroke rows and distance columns", () => {
    const html = renderToStaticMarkup(
      <BestTimeList records={mockRecords} swimmerName="Alex Morgan" defaultView="grid" />,
    );

    expect(html).toContain("Personal Bests");
    expect(html).toContain("Alex Morgan");
    expect(html).toContain("Freestyle");
    expect(html).toContain("Backstroke");
    expect(html).toContain("50m");
    expect(html).toContain("100m");
    // Formatted time for 25400 ms is 25.40
    expect(html).toContain("25.40");
    // National level badge
    expect(html).toContain("deckgala-level--national");
  });

  test("renders list view layout with table columns and rows", () => {
    const html = renderToStaticMarkup(
      <BestTimeList records={mockRecords} defaultView="list" />,
    );

    expect(html).toContain("deckgala-list-table");
    expect(html).toContain("County Championships 2026");
    expect(html).toContain("Spring Open Meet");
    expect(html).toContain("25.40");
    expect(html).toContain("56.20");
  });

  test("converts pool course times accurately with turn differentials", () => {
    // 50m Free in SCM: 25.40 (25400 ms).
    // Converted to LCM: 1 * 0.8s * 1000 = 800ms added -> 26200 ms (26.20)
    const convertedLCM = convertPoolCourseTime(
      25400,
      "FREESTYLE",
      50,
      "SHORT_COURSE_METERS",
      "LONG_COURSE_METERS",
    );
    expect(convertedLCM).toBe(26200);
    expect(formatSwimTime(convertedLCM)).toBe("26.20");

    // Converted back from LCM to SCM
    const convertedSCM = convertPoolCourseTime(
      convertedLCM,
      "FREESTYLE",
      50,
      "LONG_COURSE_METERS",
      "SHORT_COURSE_METERS",
    );
    expect(convertedSCM).toBe(25400);
  });
});

