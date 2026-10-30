import Link from "next/link";
import { notFound } from "next/navigation";
import { FoldableSplitPane } from "@deckgala/controls";
import { getActiveClub } from "../../lib/club-context";
import { prisma } from "../../lib/prisma";
import { createTrainingSchedule, deleteTrainingSchedule } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClubSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ squadId?: string }>;
}) {
  const { squadId } = await searchParams;
  const { clubId, role } = await getActiveClub();

  const [club, squads, venues, schedules] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true },
    }),
    prisma.squad.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
    }),
    prisma.venue.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
    }),
    prisma.trainingSchedule.findMany({
      where: {
        clubId,
        ...(squadId ? { squadId } : {}),
      },
      include: {
        squad: true,
        venueRef: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  if (!club) notFound();

  const canManage = role === "ADMIN" || role === "COACH";
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  const leftPane = (
    <div className="panel" style={{ height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <p className="eyebrow">Weekly Timetable</p>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Squad Training Sessions</h2>
        </div>
        <span className="status" style={{ fontSize: "11px" }}>
          {schedules.length} Sessions Scheduled
        </span>
      </div>

      {schedules.length === 0 ? (
        <div className="empty">
          No training sessions scheduled. Use the form on the right to schedule squad training hours.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {days.map((day) => {
            const daySessions = schedules.filter((s) => s.dayOfWeek === day);
            if (daySessions.length === 0) return null;

            return (
              <div key={day} style={{ borderBottom: "1px solid rgba(140, 160, 186, 0.12)", paddingBottom: "12px" }}>
                <span className="eyebrow" style={{ color: "var(--accent-cyan)", fontSize: "11px" }}>{day}</span>
                <div style={{ display: "grid", gap: "8px", marginTop: "6px" }}>
                  {daySessions.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        background: "rgba(11, 21, 40, 0.6)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
                            {s.startTime} – {s.endTime}
                          </strong>
                          {s.squad && (
                            <span className="status" style={{ fontSize: "10px", padding: "1px 6px" }}>
                              {s.squad.name}
                            </span>
                          )}
                        </div>
                        <div className="muted" style={{ fontSize: "12px", marginTop: "3px" }}>
                          📍 {s.venueRef?.name || s.venueName || "Home Pool"} • {s.laneAllocation || "Squad Lanes"}
                          {s.coachName && ` • Coach: ${s.coachName}`}
                        </div>
                        {s.drills && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Drills: {s.drills}
                          </div>
                        )}
                      </div>

                      {canManage && (
                        <form action={deleteTrainingSchedule}>
                          <input type="hidden" name="scheduleId" value={s.id} />
                          <button
                            type="submit"
                            style={{
                              background: "transparent",
                              color: "var(--color-start-coral)",
                              border: "none",
                              fontSize: "12px",
                              cursor: "pointer",
                              padding: "4px 8px",
                            }}
                            title="Delete session"
                          >
                            ✕
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const rightPane = (
    <div className="panel" style={{ height: "100%" }}>
      <p className="eyebrow">Session Creator</p>
      <h2 style={{ margin: "0 0 16px", fontSize: "20px" }}>Add Training Session</h2>

      {canManage ? (
        <form action={createTrainingSchedule} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label>Squad (Optional)</label>
            <select name="squadId" defaultValue="">
              <option value="">All Club Squads</option>
              {squads.map((sq) => (
                <option key={sq.id} value={sq.id}>{sq.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label>Day of Week *</label>
              <select name="dayOfWeek" defaultValue="MONDAY" required>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Venue / Pool</label>
              <select name="venueId" defaultValue="">
                <option value="">Default Home Pool</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label>Start Time (HH:mm) *</label>
              <input name="startTime" type="time" defaultValue="18:00" required />
            </div>

            <div>
              <label>End Time (HH:mm) *</label>
              <input name="endTime" type="time" defaultValue="19:30" required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label>Lane Allocation</label>
              <input name="laneAllocation" placeholder="e.g. Lanes 1 to 4" />
            </div>

            <div>
              <label>Coach in Charge</label>
              <input name="coachName" placeholder="e.g. Coach David" />
            </div>
          </div>

          <div>
            <label>Session Drills &amp; Training Focus</label>
            <input name="drills" placeholder="e.g. Aerobic capacity + turn technique" />
          </div>

          <div>
            <label>Coach Notes</label>
            <input name="notes" placeholder="e.g. Bring short fins and paddles" />
          </div>

          <div style={{ marginTop: "8px" }}>
            <button type="submit" style={{ width: "100%", padding: "11px" }}>
              + Schedule Training Session
            </button>
          </div>
        </form>
      ) : (
        <p className="muted">You must have Coach or Admin role to edit training schedules.</p>
      )}
    </div>
  );

  return (
    <div className="page-shell">
      <nav className="back-link-nav">
        <Link href="/squads" className="back-link">
          ← Back to Squad Management
        </Link>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">{club.name} Operations</p>
          <h1>Training Timetable Editor</h1>
          <p className="muted">
            Configure weekly training hours, pool lane allocations, and coaching instructions published to swimmers and parents.
          </p>
        </div>
      </section>

      {/* Foldable-Aware Dual-Pane Layout */}
      <FoldableSplitPane
        left={leftPane}
        right={rightPane}
        defaultRatio="50/50"
      />
    </div>
  );
}

