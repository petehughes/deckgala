"use client";

import React, { useState, useId } from "react";
import {
  type PoolCourse,
  type SwimStroke,
  convertPoolCourseTime,
  formatSwimTime,
} from "./swim-conversions";

export type TimingLevel = "COUNTY" | "REGIONAL" | "NATIONAL";

export interface PersonalBestRecord {
  id: string;
  stroke: SwimStroke | string;
  distance: number;
  course: PoolCourse | string;
  timeMs: number;
  achievedAt?: string | Date | null;
  meetName?: string | null;
  eventName?: string | null;
  timingLevel?: TimingLevel | null;
}

export interface BestTimeListProps {
  records: PersonalBestRecord[];
  swimmerName?: string;
  defaultView?: "grid" | "list";
  defaultCourse?: "SHORT_COURSE_METERS" | "LONG_COURSE_METERS";
  allowConversions?: boolean;
  distances?: number[];
  className?: string;
  onRecordClick?: (record: PersonalBestRecord) => void;
}

const STROKE_ORDER: Array<{ key: SwimStroke; label: string }> = [
  { key: "FREESTYLE", label: "Freestyle" },
  { key: "BACKSTROKE", label: "Backstroke" },
  { key: "BREASTSTROKE", label: "Breaststroke" },
  { key: "BUTTERFLY", label: "Butterfly" },
  { key: "INDIVIDUAL_MEDLEY", label: "Individual Medley" },
];

const DEFAULT_DISTANCES = [50, 100, 200, 400, 800, 1500];

export function BestTimeList({
  records = [],
  swimmerName,
  defaultView = "grid",
  defaultCourse = "SHORT_COURSE_METERS",
  allowConversions = true,
  distances = DEFAULT_DISTANCES,
  className = "",
  onRecordClick,
}: BestTimeListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">(defaultView);
  const [targetCourse, setTargetCourse] = useState<"SHORT_COURSE_METERS" | "LONG_COURSE_METERS">(
    defaultCourse,
  );
  const [showConverted, setShowConverted] = useState(false);
  const [filterStroke, setFilterStroke] = useState<string>("ALL");

  const filterId = useId();

  // Helper to resolve the best time for a specific stroke and distance
  function resolveEventTime(
    stroke: SwimStroke,
    distance: number,
  ): {
    record: PersonalBestRecord | null;
    displayTimeMs: number | null;
    isConverted: boolean;
  } {
    // 1. Direct course match
    const exactMatch = records.find(
      (r) => r.stroke === stroke && r.distance === distance && r.course === targetCourse,
    );
    if (exactMatch) {
      return { record: exactMatch, displayTimeMs: exactMatch.timeMs, isConverted: false };
    }

    // 2. Converted match if enabled
    if (showConverted && allowConversions) {
      const alternateCourse: PoolCourse =
        targetCourse === "SHORT_COURSE_METERS" ? "LONG_COURSE_METERS" : "SHORT_COURSE_METERS";
      const altMatch = records.find(
        (r) => r.stroke === stroke && r.distance === distance && r.course === alternateCourse,
      );

      if (altMatch) {
        const converted = convertPoolCourseTime(
          altMatch.timeMs,
          stroke,
          distance,
          altMatch.course as PoolCourse,
          targetCourse,
        );
        return { record: altMatch, displayTimeMs: converted, isConverted: true };
      }
    }

    return { record: null, displayTimeMs: null, isConverted: false };
  }

  // Filtered records for list view
  const visibleListRecords = records
    .filter((r) => {
      if (filterStroke !== "ALL" && r.stroke !== filterStroke) return false;
      if (!showConverted && r.course !== targetCourse) return false;
      return true;
    })
    .sort((a, b) => {
      const strokeIdxA = STROKE_ORDER.findIndex((s) => s.key === a.stroke);
      const strokeIdxB = STROKE_ORDER.findIndex((s) => s.key === b.stroke);
      if (strokeIdxA !== strokeIdxB) return strokeIdxA - strokeIdxB;
      return a.distance - b.distance;
    });

  return (
    <div className={`deckgala-best-times ${className}`}>
      {/* Header with Controls & Toggles */}
      <div className="deckgala-best-times__header">
        <div className="deckgala-best-times__title-area">
          <h2 className="deckgala-best-times__heading">
            Personal Bests
            {swimmerName && <span className="deckgala-best-times__subname"> · {swimmerName}</span>}
          </h2>
          <p className="deckgala-best-times__caption">
            Official race personal bests and championship standard cuts
          </p>
        </div>

        <div className="deckgala-best-times__controls">
          {/* Course Toggle: Short Course vs Long Course */}
          <div className="deckgala-btn-group" role="group" aria-label="Course selection">
            <button
              type="button"
              className={`deckgala-btn-toggle ${targetCourse === "SHORT_COURSE_METERS" ? "is-active" : ""}`}
              onClick={() => setTargetCourse("SHORT_COURSE_METERS")}
            >
              25m SC
            </button>
            <button
              type="button"
              className={`deckgala-btn-toggle ${targetCourse === "LONG_COURSE_METERS" ? "is-active" : ""}`}
              onClick={() => setTargetCourse("LONG_COURSE_METERS")}
            >
              50m LC
            </button>
          </div>

          {/* Converted values checkbox/toggle */}
          {allowConversions && (
            <label className="deckgala-toggle-label" htmlFor={`${filterId}-converted`}>
              <input
                id={`${filterId}-converted`}
                type="checkbox"
                checked={showConverted}
                onChange={(e) => setShowConverted(e.target.checked)}
                className="deckgala-checkbox"
              />
              <span>Converted Times</span>
            </label>
          )}

          {/* View Mode Toggle: Grid vs List */}
          <div className="deckgala-btn-group" role="group" aria-label="View layout">
            <button
              type="button"
              className={`deckgala-btn-toggle ${viewMode === "grid" ? "is-active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Matrix View (Strokes × Distances)"
              aria-label="Matrix View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
              </svg>
              Grid
            </button>
            <button
              type="button"
              className={`deckgala-btn-toggle ${viewMode === "list" ? "is-active" : ""}`}
              onClick={() => setViewMode("list")}
              title="Table List View"
              aria-label="List View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
              </svg>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Standards Badge Key / Legend */}
      <div className="deckgala-best-times__legend">
        <span className="deckgala-legend-title">Qualification Timing:</span>
        <span className="deckgala-badge deckgala-badge--national">National</span>
        <span className="deckgala-badge deckgala-badge--regional">Regional</span>
        <span className="deckgala-badge deckgala-badge--county">County</span>
        {showConverted && (
          <span className="deckgala-badge deckgala-badge--converted">~ Converted</span>
        )}
      </div>

      {/* GRID / MATRIX VIEW */}
      {viewMode === "grid" ? (
        <div className="deckgala-table-scroll">
          <table className="deckgala-matrix-table">
            <thead>
              <tr>
                <th className="deckgala-col-stroke">Stroke</th>
                {distances.map((dist) => (
                  <th key={dist} className="deckgala-col-dist">
                    {dist}m
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STROKE_ORDER.map(({ key: strokeKey, label: strokeLabel }) => (
                <tr key={strokeKey}>
                  <td className="deckgala-row-header">
                    <strong>{strokeLabel}</strong>
                  </td>
                  {distances.map((dist) => {
                    const { record, displayTimeMs, isConverted } = resolveEventTime(strokeKey, dist);
                    const timingLevel = record?.timingLevel;

                    if (!displayTimeMs || !record) {
                      return (
                        <td key={dist} className="deckgala-cell deckgala-cell--empty">
                          <span className="deckgala-empty-mark">—</span>
                        </td>
                      );
                    }

                    const achievedDate = record.achievedAt
                      ? new Date(record.achievedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date unrecorded";

                    const meetText = record.meetName || record.eventName || "Official Time Trial";
                    const tooltipText = `${strokeLabel} ${dist}m (${isConverted ? "Converted to " : ""}${targetCourse === "SHORT_COURSE_METERS" ? "25m SC" : "50m LC"})\nRecorded: ${achievedDate}\nMeet: ${meetText}${timingLevel ? `\nCut Level: ${timingLevel}` : ""}`;

                    const levelClass = timingLevel ? `deckgala-level--${timingLevel.toLowerCase()}` : "";
                    const convertedClass = isConverted ? "deckgala-time--converted" : "";

                    return (
                      <td
                        key={dist}
                        className={`deckgala-cell deckgala-cell--filled ${levelClass}`}
                        onClick={() => onRecordClick?.(record)}
                        tabIndex={0}
                        role="button"
                        aria-label={tooltipText}
                      >
                        <div className="deckgala-cell-inner" data-tooltip={tooltipText}>
                          <span className={`deckgala-cell-time ${convertedClass}`}>
                            {isConverted ? `~${formatSwimTime(displayTimeMs)}` : formatSwimTime(displayTimeMs)}
                          </span>
                          {timingLevel && (
                            <span className={`deckgala-mini-tag deckgala-mini-tag--${timingLevel.toLowerCase()}`}>
                              {timingLevel[0]}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* LIST / TABULAR VIEW */
        <div className="deckgala-list-view">
          <div className="deckgala-list-filters">
            <label htmlFor={`${filterId}-stroke-filter`}>Filter Stroke:</label>
            <select
              id={`${filterId}-stroke-filter`}
              value={filterStroke}
              onChange={(e) => setFilterStroke(e.target.value)}
              className="deckgala-select"
            >
              <option value="ALL">All Strokes</option>
              {STROKE_ORDER.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {visibleListRecords.length === 0 ? (
            <div className="deckgala-empty-state">
              No personal best times found for the selected course or filter.
            </div>
          ) : (
            <div className="deckgala-table-scroll">
              <table className="deckgala-list-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Course</th>
                    <th>Time</th>
                    <th>Timing Level</th>
                    <th>Meet / Gala</th>
                    <th>Achieved At</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleListRecords.map((r) => {
                    const strokeLabel =
                      STROKE_ORDER.find((s) => s.key === r.stroke)?.label || r.stroke;
                    const isSC = r.course === "SHORT_COURSE_METERS";
                    const isTargetCourse = r.course === targetCourse;
                    const convertedTime =
                      showConverted && !isTargetCourse
                        ? convertPoolCourseTime(
                            r.timeMs,
                            r.stroke as SwimStroke,
                            r.distance,
                            r.course as PoolCourse,
                            targetCourse,
                          )
                        : null;

                    const levelClass = r.timingLevel
                      ? `deckgala-level--${r.timingLevel.toLowerCase()}`
                      : "";

                    return (
                      <tr
                        key={r.id}
                        className={`deckgala-list-row ${levelClass}`}
                        onClick={() => onRecordClick?.(r)}
                      >
                        <td>
                          <strong>{strokeLabel} {r.distance}m</strong>
                        </td>
                        <td>
                          <span className="deckgala-course-badge">
                            {isSC ? "25m Short Course" : "50m Long Course"}
                          </span>
                        </td>
                        <td>
                          <div className="deckgala-list-time-cell">
                            <span className="deckgala-cell-time">{formatSwimTime(r.timeMs)}</span>
                            {convertedTime && (
                              <span className="deckgala-converted-sub">
                                (~{formatSwimTime(convertedTime)} {targetCourse === "SHORT_COURSE_METERS" ? "SC" : "LC"})
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {r.timingLevel ? (
                            <span className={`deckgala-badge deckgala-badge--${r.timingLevel.toLowerCase()}`}>
                              {r.timingLevel}
                            </span>
                          ) : (
                            <span className="deckgala-dimmed">—</span>
                          )}
                        </td>
                        <td>{r.meetName || r.eventName || "Club Time Trial"}</td>
                        <td>
                          {r.achievedAt
                            ? new Date(r.achievedAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

