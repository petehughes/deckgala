import type { Gender, PoolCourse, SwimStroke } from "@deckgala/database";

export interface DefaultEventDefinition {
  name: string;
  distance: number;
  stroke: SwimStroke;
  gender: Gender;
  ageGroup: string;
  allowNoTime: boolean;
}

/**
 * Returns the list of default competitive events for Boys and Girls
 * based on the size/course of the pool:
 * - 25m Short Course: 36 events (18 Girls + 18 Boys: 50/100/200/400/800/1500m Free, 50/100/200m Back/Breast/Fly, 100/200/400m IM)
 * - 50m Long Course: 34 events (17 Girls + 17 Boys: excluding 100m IM which is physically impossible in a 50m pool)
 * - 25y Short Course Yards: 36 events (18 Girls + 18 Boys)
 */
export function getDefaultEventsForCourse(course: PoolCourse): DefaultEventDefinition[] {
  const is50m = course === "LONG_COURSE_METERS";
  const unit = course === "SHORT_COURSE_YARDS" ? "y" : "m";

  interface StrokeDistance {
    stroke: SwimStroke;
    distance: number;
    strokeName: string;
  }

  const raceTypes: StrokeDistance[] = [
    // 50m Sprints
    { stroke: "FREESTYLE", distance: 50, strokeName: "Freestyle" },
    { stroke: "BREASTSTROKE", distance: 50, strokeName: "Breaststroke" },
    { stroke: "BACKSTROKE", distance: 50, strokeName: "Backstroke" },
    { stroke: "BUTTERFLY", distance: 50, strokeName: "Butterfly" },

    // 100m Races
    { stroke: "FREESTYLE", distance: 100, strokeName: "Freestyle" },
    { stroke: "BREASTSTROKE", distance: 100, strokeName: "Breaststroke" },
    { stroke: "BACKSTROKE", distance: 100, strokeName: "Backstroke" },
    { stroke: "BUTTERFLY", distance: 100, strokeName: "Butterfly" },
    // 100m Individual Medley is only contested in 25m / 25y pools
    ...(!is50m
      ? [{ stroke: "INDIVIDUAL_MEDLEY" as SwimStroke, distance: 100, strokeName: "Individual Medley" }]
      : []),

    // 200m Races
    { stroke: "FREESTYLE", distance: 200, strokeName: "Freestyle" },
    { stroke: "BREASTSTROKE", distance: 200, strokeName: "Breaststroke" },
    { stroke: "BACKSTROKE", distance: 200, strokeName: "Backstroke" },
    { stroke: "BUTTERFLY", distance: 200, strokeName: "Butterfly" },
    { stroke: "INDIVIDUAL_MEDLEY", distance: 200, strokeName: "Individual Medley" },

    // 400m Races
    { stroke: "FREESTYLE", distance: 400, strokeName: "Freestyle" },
    { stroke: "INDIVIDUAL_MEDLEY", distance: 400, strokeName: "Individual Medley" },

    // Distance Freestyle
    { stroke: "FREESTYLE", distance: 800, strokeName: "Freestyle" },
    { stroke: "FREESTYLE", distance: 1500, strokeName: "Freestyle" },
  ];

  const events: DefaultEventDefinition[] = [];

  // Alternating standard order: Girls then Boys
  for (const race of raceTypes) {
    events.push({
      name: `Girls ${race.distance}${unit} ${race.strokeName}`,
      distance: race.distance,
      stroke: race.stroke,
      gender: "FEMALE",
      ageGroup: "Open",
      allowNoTime: true,
    });
    events.push({
      name: `Boys ${race.distance}${unit} ${race.strokeName}`,
      distance: race.distance,
      stroke: race.stroke,
      gender: "MALE",
      ageGroup: "Open",
      allowNoTime: true,
    });
  }

  return events;
}

/**
 * Returns user-friendly summary metadata for the pool course
 */
export function getCourseDetails(course: PoolCourse) {
  switch (course) {
    case "LONG_COURSE_METERS":
      return {
        badge: "50m Long Course",
        poolSizeLabel: "50m Olympic Pool",
        eventCount: 34,
        description: "34 events (17 Girls + 17 Boys; no 100m IM)",
      };
    case "SHORT_COURSE_YARDS":
      return {
        badge: "25y Short Course",
        poolSizeLabel: "25y Pool",
        eventCount: 36,
        description: "36 events (18 Girls + 18 Boys; includes 100y IM)",
      };
    case "SHORT_COURSE_METERS":
    default:
      return {
        badge: "25m Short Course",
        poolSizeLabel: "25m Pool",
        eventCount: 36,
        description: "36 events (18 Girls + 18 Boys; includes 100m IM)",
      };
  }
}

