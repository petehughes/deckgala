import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getDefaultEventsForCourse, getCourseDetails } from "./default-events";

describe("default-events", () => {
  it("generates 36 events for 25m Short Course including 100m IM", () => {
    const events = getDefaultEventsForCourse("SHORT_COURSE_METERS");
    assert.equal(events.length, 36);

    const girls = events.filter((e) => e.gender === "FEMALE");
    const boys = events.filter((e) => e.gender === "MALE");
    assert.equal(girls.length, 18);
    assert.equal(boys.length, 18);

    // Verify 100m IM exists for both
    const im100 = events.filter((e) => e.stroke === "INDIVIDUAL_MEDLEY" && e.distance === 100);
    assert.equal(im100.length, 2);
    assert.equal(im100[0].name, "Girls 100m Individual Medley");
    assert.equal(im100[1].name, "Boys 100m Individual Medley");

    // Verify alternating gender pattern
    for (let i = 0; i < events.length; i += 2) {
      assert.equal(events[i].gender, "FEMALE");
      assert.equal(events[i + 1].gender, "MALE");
      assert.equal(events[i].distance, events[i + 1].distance);
      assert.equal(events[i].stroke, events[i + 1].stroke);
    }
  });

  it("generates 34 events for 50m Long Course and excludes 100m IM", () => {
    const events = getDefaultEventsForCourse("LONG_COURSE_METERS");
    assert.equal(events.length, 34);

    const girls = events.filter((e) => e.gender === "FEMALE");
    const boys = events.filter((e) => e.gender === "MALE");
    assert.equal(girls.length, 17);
    assert.equal(boys.length, 17);

    // Verify 100m IM does NOT exist for 50m pool
    const im100 = events.filter((e) => e.stroke === "INDIVIDUAL_MEDLEY" && e.distance === 100);
    assert.equal(im100.length, 0);

    // Verify 200m and 400m IM exist
    const im200 = events.filter((e) => e.stroke === "INDIVIDUAL_MEDLEY" && e.distance === 200);
    const im400 = events.filter((e) => e.stroke === "INDIVIDUAL_MEDLEY" && e.distance === 400);
    assert.equal(im200.length, 2);
    assert.equal(im400.length, 2);
  });

  it("generates 36 events for 25y Short Course Yards with yard unit labeling", () => {
    const events = getDefaultEventsForCourse("SHORT_COURSE_YARDS");
    assert.equal(events.length, 36);

    const sample = events[0];
    assert.equal(sample.name, "Girls 50y Freestyle");
    const im100 = events.find((e) => e.stroke === "INDIVIDUAL_MEDLEY" && e.distance === 100);
    assert.equal(im100?.name, "Girls 100y Individual Medley");
  });

  it("provides correct course details metadata", () => {
    assert.equal(getCourseDetails("SHORT_COURSE_METERS").eventCount, 36);
    assert.equal(getCourseDetails("LONG_COURSE_METERS").eventCount, 34);
    assert.equal(getCourseDetails("SHORT_COURSE_YARDS").eventCount, 36);
  });
});

