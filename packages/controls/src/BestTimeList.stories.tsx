import type { Meta, StoryObj } from "@storybook/react";
import { BestTimeList, type PersonalBestRecord } from "./BestTimeList";

const meta: Meta<typeof BestTimeList> = {
  title: "Controls/BestTimeList",
  component: BestTimeList,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BestTimeList>;

const sampleRecords: PersonalBestRecord[] = [
  // Freestyle
  {
    id: "pb-1",
    stroke: "FREESTYLE",
    distance: 50,
    course: "SHORT_COURSE_METERS",
    timeMs: 25140,
    achievedAt: "2026-04-12T00:00:00.000Z",
    meetName: "British National Championships",
    timingLevel: "NATIONAL",
  },
  {
    id: "pb-2",
    stroke: "FREESTYLE",
    distance: 100,
    course: "SHORT_COURSE_METERS",
    timeMs: 55420,
    achievedAt: "2026-03-18T00:00:00.000Z",
    meetName: "London Regional Winter Championships",
    timingLevel: "REGIONAL",
  },
  {
    id: "pb-3",
    stroke: "FREESTYLE",
    distance: 200,
    course: "SHORT_COURSE_METERS",
    timeMs: 122400,
    achievedAt: "2026-02-14T00:00:00.000Z",
    meetName: "Middlesex County Championships",
    timingLevel: "COUNTY",
  },
  {
    id: "pb-4",
    stroke: "FREESTYLE",
    distance: 400,
    course: "SHORT_COURSE_METERS",
    timeMs: 264800,
    achievedAt: "2026-01-20T00:00:00.000Z",
    meetName: "Club Level 3 Open Meet",
    timingLevel: null,
  },
  // Backstroke
  {
    id: "pb-5",
    stroke: "BACKSTROKE",
    distance: 50,
    course: "SHORT_COURSE_METERS",
    timeMs: 29120,
    achievedAt: "2026-04-12T00:00:00.000Z",
    meetName: "County Championships",
    timingLevel: "COUNTY",
  },
  {
    id: "pb-6",
    stroke: "BACKSTROKE",
    distance: 100,
    course: "LONG_COURSE_METERS",
    timeMs: 64100,
    achievedAt: "2026-05-02T00:00:00.000Z",
    meetName: "British Summer Meet",
    timingLevel: "REGIONAL",
  },
  // Breaststroke
  {
    id: "pb-7",
    stroke: "BREASTSTROKE",
    distance: 50,
    course: "SHORT_COURSE_METERS",
    timeMs: 31890,
    achievedAt: "2026-04-11T00:00:00.000Z",
    meetName: "County Championships",
    timingLevel: "REGIONAL",
  },
  {
    id: "pb-8",
    stroke: "BREASTSTROKE",
    distance: 100,
    course: "SHORT_COURSE_METERS",
    timeMs: 70400,
    achievedAt: "2026-03-15T00:00:00.000Z",
    meetName: "Winter Meet",
    timingLevel: "COUNTY",
  },
  // Butterfly
  {
    id: "pb-9",
    stroke: "BUTTERFLY",
    distance: 50,
    course: "SHORT_COURSE_METERS",
    timeMs: 27800,
    achievedAt: "2026-04-12T00:00:00.000Z",
    meetName: "National Qualifiers",
    timingLevel: "NATIONAL",
  },
  {
    id: "pb-10",
    stroke: "BUTTERFLY",
    distance: 100,
    course: "SHORT_COURSE_METERS",
    timeMs: 62300,
    achievedAt: "2026-03-20T00:00:00.000Z",
    meetName: "Regional Championships",
    timingLevel: "REGIONAL",
  },
  // IM
  {
    id: "pb-11",
    stroke: "INDIVIDUAL_MEDLEY",
    distance: 200,
    course: "SHORT_COURSE_METERS",
    timeMs: 138900,
    achievedAt: "2026-04-13T00:00:00.000Z",
    meetName: "Spring Championship Gala",
    timingLevel: "REGIONAL",
  },
];

export const GridMatrixView: Story = {
  args: {
    records: sampleRecords,
    swimmerName: "Oliver Davies",
    defaultView: "grid",
    defaultCourse: "SHORT_COURSE_METERS",
    allowConversions: true,
  },
};

export const ListView: Story = {
  args: {
    records: sampleRecords,
    swimmerName: "Oliver Davies",
    defaultView: "list",
    defaultCourse: "SHORT_COURSE_METERS",
    allowConversions: true,
  },
};

export const LongCourseView: Story = {
  args: {
    records: sampleRecords,
    swimmerName: "Oliver Davies",
    defaultView: "grid",
    defaultCourse: "LONG_COURSE_METERS",
    allowConversions: true,
  },
};

export const EmptyState: Story = {
  args: {
    records: [],
    swimmerName: "New Swimmer",
    defaultView: "grid",
  },
};

