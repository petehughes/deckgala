import Link from "next/link";
import { getParentContext } from "../lib/parent-context";
import { prisma } from "../lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, linkedSwimmers, activeSwimmer } = await getParentContext();

  if (!activeSwimmer) {
    return (
      <main className="page-shell">
        <section className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p className="eyebrow">Welcome to AquaTeamHub</p>
          <h1>Welcome, {user.name}!</h1>
          <p className="muted" style={{ maxWidth: "480px", margin: "0 auto 24px" }}>
            You haven&apos;t linked any swimmer profiles to your family account yet. Connect your children&apos;s club profiles to view personal bests, training timetables, and submit meet entries.
          </p>
          <Link href="https://auth.aquateamhub.com/link-swimmer" className="btn-primary" style={{ display: "inline-flex" }}>
            🔗 Link Your Swimmer →
          </Link>
        </section>
      </main>
    );
  }

  // Fetch active swimmer's upcoming entries & personal bests
  const [galaEntries, personalBests, upcomingSchedules] = await Promise.all([
    prisma.galaEntry.findMany({
      where: { swimmerId: activeSwimmer.id },
      include: {
        gala: true,
        eventEntries: {
          include: { event: true },
        },
      },
      orderBy: { gala: { startsAt: "asc" } },
      take: 3,
    }),
    prisma.personalBest.findMany({
      where: { swimmerId: activeSwimmer.id },
      orderBy: { achievedAt: "desc" },
      take: 4,
    }),
    prisma.trainingSchedule.findMany({
      where: { clubId: activeSwimmer.clubId },
      include: { squad: true, venueRef: true },
      take: 4,
    }),
  ]);

  return (
    <main className="page-shell">
      {/* Hero Header */}
      <section className="hero">
        <div>
          <p className="eyebrow">{activeSwimmer.clubName} • {activeSwimmer.squadName || "Competitive Squad"}</p>
          <h1>{activeSwimmer.firstName} {activeSwimmer.lastName}</h1>
          <p className="muted">
            Swim England ID: <strong>{activeSwimmer.governingBodyId || "Not Registered"}</strong> • {activeSwimmer.gender || "Open"} • {activeSwimmer.relationship} Profile
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/galas" className="btn-primary">
            🏊 Enter Open Galas →
          </Link>
          <Link href="/personal-bests" className="btn-secondary">
            ⚡ View All PBs
          </Link>
        </div>
      </section>

      {/* Quick Summary Cards */}
      <div className="grid-cards">
        <div className="card">
          <span className="eyebrow">Active Swimmers</span>
          <strong style={{ fontSize: "28px" }}>{linkedSwimmers.length}</strong>
          <span className="muted" style={{ fontSize: "12px" }}>
            Linked to family profile
          </span>
        </div>

        <div className="card">
          <span className="eyebrow">Meet Entries</span>
          <strong style={{ fontSize: "28px" }}>{galaEntries.length}</strong>
          <span className="muted" style={{ fontSize: "12px" }}>
            Active gala registrations
          </span>
        </div>

        <div className="card">
          <span className="eyebrow">Personal Bests</span>
          <strong style={{ fontSize: "28px" }}>{personalBests.length}</strong>
          <span className="muted" style={{ fontSize: "12px" }}>
            Official times on file
          </span>
        </div>
      </div>

      {/* Active Gala Registrations */}
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <p className="eyebrow">Meet Entries</p>
            <h2>Upcoming Competitions</h2>
          </div>
          <Link href="/galas" className="btn-secondary" style={{ fontSize: "11px", padding: "6px 12px" }}>
            Browse Galas →
          </Link>
        </div>

        {galaEntries.length === 0 ? (
          <div className="muted" style={{ textAlign: "center", padding: "30px 0", fontSize: "13px" }}>
            No active gala entries submitted for {activeSwimmer.firstName}.
            <div style={{ marginTop: "12px" }}>
              <Link href="/galas" className="btn-primary" style={{ fontSize: "12px", display: "inline-flex" }}>
                Browse Available Meets
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {galaEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  background: "rgba(11, 21, 40, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
                    {entry.gala.name}
                  </strong>
                  <div className="muted" style={{ fontSize: "12px", marginTop: "4px" }}>
                    📅 {new Date(entry.gala.startsAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} • {entry.eventEntries.length} Race Starts • £{(entry.totalFeePence / 100).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className={`status-badge ${entry.status === "CONFIRMED" || entry.status === "PAID" ? "" : "status-badge--pending"}`}>
                    {entry.status}
                  </span>
                  <Link
                    href={`/galas/${entry.gala.id}/enter`}
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "6px 10px" }}
                  >
                    View Receipt
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Training Timetable Snapshot */}
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <p className="eyebrow">Squad Schedule</p>
            <h2>Weekly Training Sessions</h2>
          </div>
          <Link href="/schedule" className="btn-secondary" style={{ fontSize: "11px", padding: "6px 12px" }}>
            Full Timetable →
          </Link>
        </div>

        {upcomingSchedules.length === 0 ? (
          <p className="muted" style={{ fontSize: "13px" }}>
            No regular training sessions published for this squad yet.
          </p>
        ) : (
          <div className="grid-cards">
            {upcomingSchedules.map((item) => (
              <div key={item.id} className="card" style={{ padding: "16px" }}>
                <span className="eyebrow">{item.dayOfWeek}</span>
                <strong style={{ fontSize: "16px" }}>{item.startTime} – {item.endTime}</strong>
                <span className="muted" style={{ fontSize: "12px" }}>
                  📍 {item.venueRef?.name || item.venueName || "Home Pool"} • {item.laneAllocation || "Squad Lanes"}
                </span>
                {item.coachName && (
                  <span style={{ fontSize: "11px", color: "var(--accent-cyan)" }}>
                    Coach: {item.coachName}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

