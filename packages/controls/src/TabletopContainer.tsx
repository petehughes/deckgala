import React from "react";

export interface TabletopContainerProps {
  display: React.ReactNode;
  controls: React.ReactNode;
  className?: string;
  displayClassName?: string;
  controlsClassName?: string;
  id?: string;
}

/**
 * TabletopContainer:
 * Implements CSS Viewport Segments API support for vertical half-folded postures (`vertical-viewport-segments: 2`).
 * When partially folded in tabletop posture (e.g., poolside on bench or table):
 * - Upper display panel is allocated to the ambient passive screen (scoreboard, heat clock).
 * - Lower panel is allocated to flat, tactile, spill-resistant poolside touch controls.
 */
export function TabletopContainer({
  display,
  controls,
  className = "",
  displayClassName = "",
  controlsClassName = "",
  id,
}: TabletopContainerProps) {
  return (
    <div
      id={id}
      className={`deckgala-tabletop-container flex flex-col w-full h-full min-h-0 ${className}`}
      data-testid="tabletop-container"
    >
      <div
        className={`deckgala-tabletop-container__display flex-1 min-h-0 flex flex-col justify-center items-center p-4 bg-[var(--color-deep-abyss)] ${displayClassName}`}
        data-testid="tabletop-display"
      >
        {display}
      </div>
      <div
        className={`deckgala-tabletop-container__controls flex-1 min-h-0 flex flex-col p-4 bg-[var(--color-poolside-slate)] border-t border-[var(--color-slate-elevated)] ${controlsClassName}`}
        data-testid="tabletop-controls"
      >
        {controls}
      </div>
    </div>
  );
}

