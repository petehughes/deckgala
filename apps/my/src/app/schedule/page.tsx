import { FoldableSplitPane } from "@deckgala/controls";
import { getParentContext } from "../../lib/parent-context";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const { activeSwimmer } = await getParentContext();

  const schedules = await prisma.trainingSchedule.findMany({
    where: {
      clubId: activeSwimmer ? activeSwimmer.clubId : undefined,
    },
    include: {
      squad: true,
      venueRef: true,
    },
    orderBy: { startTime: "asc" },
  });

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  const leftMaster = (
    <div className="panel" style={{ height: "100%" }}>
      <p className="eyebrow">Weekly Timetable</p>
      <h2>Training Schedule</h2>
      <p className="muted" style={{ fontSize: "13px", marginBottom: "16px" }}>
        Weekly pool allocations for {activeSwimmer?.squadName || "All Squads"}.
      </p>

      {schedules.length === 0 ? (
        <p className="muted">No training sessions scheduled at this time.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {days.map((day) => {
            const daySessions = schedules.filter((s) => s.dayOfWeek === day);
            if (daySessions.length === 0) return null;

            return (
              <div key={day} style={{ borderBottom: "1px solid rgba(140, 160, 186, 0.12)", paddingBottom: "10px" }}>
                <span className="eyebrow" style={{ color: "var(--accent-cyan)", fontSize: "10px" }}>{day}</span>
                {daySessions.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <div>
                      <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                        {s.startTime} – {s.endTime}
                      </strong>
                      <div className="muted" style={{ fontSize: "11px" }}>
                        {s.venueRef?.name || s.venueName || "Home Pool"} • {s.laneAllocation || "Lanes 1-4"}
                      </div>
                    </div>
                    {s.squad?.name && (
                      <span className="status-badge" style={{ fontSize: "10px" }}>
                        {s.squad.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const rightDetail = (
    <div className="panel" style={{ height: "100%" }}>
      <p className="eyebrow">Coaching Focus &amp; Notes</p>
      <h2>Session Preparation</h2>
      <p className="muted" style={{ fontSize: "13px", marginBottom: "18px" }}>
        Swimmer equipment checklists, arrival protocols, and squad targets.
      </p>

      <div style={{ display: "grid", gap: "16px" }}>
        <div className="card">
          <strong style={{ color: "var(--accent-cyan)", fontSize: "14px" }}>🎒 Poolside Kit List</strong>
          <ul className="muted" style={{ fontSize: "13px", margin: "6px 0 0", paddingLeft: "20px" }}>
            <li>Kickboard, pull buoy, and short training fins</li>
            <li>Deck drink bottle (minimum 750ml electrolyte/water)</li>
            <li>Club competition cap and spare goggles</li>
          </ul>
        </div>

        <div className="card">
          <strong style={{ color: "var(--accent-cyan)", fontSize: "14px" }}>⏰ Arrival Protocols</strong>
          <p className="muted" style={{ fontSize: "13px", margin: "6px 0 0" }}>
            Please ensure swimmers arrive on poolside <strong>15 minutes prior</strong> to water time for activation and dynamic dry-land stretching.
          </p>
        </div>

        <div className="card">
          <strong style={{ color: "var(--accent-cyan)", fontSize: "14px" }}>🔔 Web Push Alerts</strong>
          <p className="muted" style={{ fontSize: "13px", margin: "6px 0 0" }}>
            Live push notifications are activated for session cancellations, pool emergency closures, and lane changes.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Squad Operations</p>
          <h1>Training Schedule</h1>
          <p className="muted">
            {activeSwimmer ? `${activeSwimmer.clubName} timetable for ${activeSwimmer.firstName}` : "Club training schedule"}
          </p>
        </div>
      </section>

      {/* Foldable-Aware Dual-Pane Workspace */}
      <FoldableSplitPane
        left={leftMaster}
        right={rightDetail}
        defaultRatio="50/50"
      />
    </main>
  );
}

