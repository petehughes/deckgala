import type { ReactNode } from "react";
import { TimerDisplay } from "./TimerDisplay";

export type LaneStatus = "ready" | "active" | "finished" | "disqualified";

export interface LaneCardProps {
  lane: number;
  elapsedMs: number;
  status?: LaneStatus;
  swimmerName?: string;
  children?: ReactNode;
  className?: string;
}

const statusLabels: Record<LaneStatus, string> = {
  ready: "Ready",
  active: "Active",
  finished: "Finished",
  disqualified: "Disqualified",
};

export function LaneCard({
  lane,
  elapsedMs,
  status = "ready",
  swimmerName,
  children,
  className,
}: LaneCardProps) {
  return (
    <section
      className={["deckgala-lane-card", `deckgala-lane-card--${status}`, className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Lane ${lane}`}
    >
      <header className="deckgala-lane-card__header">
        <h2 className="deckgala-lane-card__heading">Lane {lane}</h2>
        <span className="deckgala-lane-card__status">{statusLabels[status]}</span>
      </header>
      {swimmerName && <p className="deckgala-lane-card__swimmer">{swimmerName}</p>}
      <TimerDisplay elapsedMs={elapsedMs} />
      {children && <div className="deckgala-lane-card__content">{children}</div>}
    </section>
  );
}
