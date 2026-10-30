import Link from "next/link";
import { notFound } from "next/navigation";
import { getParentContext } from "../../../../lib/parent-context";
import { prisma } from "../../../../lib/prisma";
import { checkEventEligibility } from "../../../../lib/qualifying-checker";
import { submitGalaEntryAction } from "../../../actions";

export const dynamic = "force-dynamic";

function formatMs(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return "NT";
  const hundredths = Math.round(ms / 10) % 100;
  const totalSecs = Math.floor(ms / 1000);
  const secs = totalSecs % 60;
  const mins = Math.floor(totalSecs / 60);
  const hStr = hundredths.toString().padStart(2, "0");
  const sStr = secs.toString().padStart(2, "0");
  return mins > 0 ? `${mins}:${sStr}.${hStr}` : `${secs}.${hStr}`;
}

export default async function GalaEntryWizardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { id: galaId } = await params;
  const { submitted, error } = await searchParams;
  const { activeSwimmer } = await getParentContext();

  if (!activeSwimmer) {
    return (
      <main className="page-shell">
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <h2>No Swimmer Profile Selected</h2>
          <p className="muted">Please link or select a swimmer to enter this gala.</p>
          <Link href="/my-swimmers" className="btn-primary" style={{ display: "inline-flex" }}>
            Select Swimmer
          </Link>
        </div>
      </main>
    );
  }

  const gala = await prisma.gala.findUnique({
    where: { id: galaId },
    include: {
      venueRef: true,
      events: {
        orderBy: [{ sessionNumber: "asc" }, { eventNumber: "asc" }],
      },
      entries: {
        where: { swimmerId: activeSwimmer.id },
        include: {
          eventEntries: {
            include: { event: true },
          },
        },
      },
    },
  });

  if (!gala) notFound();

  // Fetch active swimmer PBs to check eligibility against cuts
  const swimmerPbs = await prisma.personalBest.findMany({
    where: { swimmerId: activeSwimmer.id },
  });

  const existingEntry = gala.entries.length > 0 ? gala.entries[0] : null;

  return (
    <main className="page-shell">
      <nav style={{ marginBottom: "12px" }}>
        <Link href="/galas" className="muted" style={{ textDecoration: "none", fontSize: "13px" }}>
          ← Back to Galas
        </Link>
      </nav>

      {/* Hero Header */}
      <section className="hero">
        <div>
          <p className="eyebrow">Meet Entry Form</p>
          <h1>{gala.name}</h1>
          <p className="muted">
            Entering: <strong>{activeSwimmer.firstName} {activeSwimmer.lastName}</strong> ({activeSwimmer.clubName})
          </p>
        </div>
      </section>

      {error && (
        <div className="status-badge status-badge--error" style={{ padding: "12px 16px", borderRadius: "8px", fontSize: "13px" }}>
          {decodeURIComponent(error)}
        </div>
      )}

      {/* Digital Receipt View if Already Submitted */}
      {(existingEntry || submitted) && (
        <section className="receipt-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span className="eyebrow" style={{ color: "var(--color-pace-green)" }}>✓ ENTRY CONFIRMED</span>
              <h2 style={{ margin: "4px 0 0" }}>Digital Entry Receipt</h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="muted" style={{ fontSize: "11px" }}>CONFIRMATION ID</span>
              <div className="mono-time" style={{ fontSize: "16px", color: "var(--accent-cyan)" }}>
                {existingEntry?.id.slice(-8).toUpperCase() || "SUBMITTED"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "14px 0" }}>
            <div>
              <span className="muted" style={{ fontSize: "11px" }}>SWIMMER</span>
              <div><strong>{activeSwimmer.firstName} {activeSwimmer.lastName}</strong></div>
            </div>
            <div>
              <span className="muted" style={{ fontSize: "11px" }}>SWIM ENGLAND ID</span>
              <div><strong>{activeSwimmer.governingBodyId || "On File"}</strong></div>
            </div>
            <div>
              <span className="muted" style={{ fontSize: "11px" }}>PAYMENT STATUS</span>
              <div><strong style={{ color: "var(--accent-amber)" }}>{existingEntry?.status || "SUBMITTED"} ({existingEntry?.paymentMethod || "POOL_DESK"})</strong></div>
            </div>
            <div>
              <span className="muted" style={{ fontSize: "11px" }}>TOTAL FEES</span>
              <div className="mono-time" style={{ fontSize: "16px" }}>£{((existingEntry?.totalFeePence ?? 0) / 100).toFixed(2)}</div>
            </div>
          </div>

          {existingEntry?.eventEntries && existingEntry.eventEntries.length > 0 && (
            <div>
              <h3 style={{ fontSize: "14px", margin: "0 0 8px" }}>Entered Events ({existingEntry.eventEntries.length})</h3>
              <div style={{ display: "grid", gap: "6px" }}>
                {existingEntry.eventEntries.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "6px 0", borderBottom: "1px solid rgba(140, 160, 186, 0.1)" }}>
                    <span>Ev #{item.event.eventNumber} • {item.event.distance}m {item.event.stroke}</span>
                    <span className="mono-time">{item.seedTimeMs ? formatMs(item.seedTimeMs) : "NT"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="muted" style={{ fontSize: "12px", margin: 0 }}>
            Present this digital receipt at the gala check-in desk or poolside registration.
          </p>
        </section>
      )}

      {/* Entry Form */}
      <section className="panel">
        <h2 style={{ fontSize: "18px" }}>Select Events to Enter</h2>
        <p className="muted" style={{ fontSize: "13px", marginBottom: "20px" }}>
          Qualifying cut times and cutoff limits are evaluated automatically against {activeSwimmer.firstName}&apos;s recorded personal bests.
        </p>

        <form action={submitGalaEntryAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <input type="hidden" name="galaId" value={gala.id} />
          <input type="hidden" name="swimmerId" value={activeSwimmer.id} />

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>Select</th>
                  <th>Ev #</th>
                  <th>Event Description</th>
                  <th>Swimmer PB</th>
                  <th>Qualifying Cut</th>
                  <th>Cutoff (No Faster)</th>
                  <th>Eligibility</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {gala.events.map((ev) => {
                  const pb = swimmerPbs.find((p) => p.stroke === ev.stroke && p.distance === ev.distance);
                  const pbTimeMs = pb?.timeMs ?? null;
                  const eligibility = checkEventEligibility(pbTimeMs, ev.qualifyingTimeMs, ev.cutoffTimeMs, ev.allowNoTime);
                  const eventFee = ev.feePence ?? gala.defaultEventFeePence;

                  const isCheckedDefault = existingEntry?.eventEntries.some((e) => e.eventId === ev.id) ?? false;

                  return (
                    <tr key={ev.id} style={{ opacity: eligibility.isEligible ? 1 : 0.6 }}>
                      <td>
                        <input
                          type="checkbox"
                          name="eventIds"
                          value={ev.id}
                          defaultChecked={isCheckedDefault}
                          disabled={!eligibility.isEligible}
                          style={{ width: "18px", height: "18px", accentColor: "var(--accent-cyan)", cursor: eligibility.isEligible ? "pointer" : "not-allowed" }}
                        />
                        <input
                          type="hidden"
                          name={`seedTime_${ev.id}`}
                          value={pbTimeMs ?? ""}
                        />
                      </td>
                      <td>
                        <strong>#{ev.eventNumber}</strong>
                      </td>
                      <td>
                        <strong>{ev.distance}m {ev.stroke}</strong>
                        <small className="muted">{ev.gender || "Open"} • {ev.ageGroup || "Open"}</small>
                      </td>
                      <td>
                        <span className="mono-time">{formatMs(pbTimeMs)}</span>
                      </td>
                      <td>
                        <span className="mono-time">{formatMs(ev.qualifyingTimeMs)}</span>
                      </td>
                      <td>
                        <span className="mono-time" style={{ color: "var(--color-caution-amber)" }}>
                          {formatMs(ev.cutoffTimeMs)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${eligibility.isEligible ? "" : "status-badge--error"}`}
                          title={eligibility.reason}
                        >
                          {eligibility.status === "QUALIFIED"
                            ? "✓ Qualified"
                            : eligibility.status === "NO_TIME_ALLOWED"
                            ? "✓ NT Allowed"
                            : "✕ Ineligible"}
                        </span>
                      </td>
                      <td>
                        <span className="mono-time">£{(eventFee / 100).toFixed(2)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "18px" }}>
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select id="paymentMethod" name="paymentMethod" defaultValue="POOL_DESK">
                <option value="POOL_DESK">Pay at Gala Pool Desk / Registration</option>
                <option value="ONLINE">Online Card / Apple Pay</option>
                <option value="INVOICE">Direct Club Squad Invoice</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Coaching or Welfare Notes (Optional)</label>
              <input
                id="notes"
                name="notes"
                placeholder="e.g. First gala in 50m pool"
              />
            </div>
          </div>

          <div>
            <button type="submit" className="btn-primary" style={{ fontSize: "14px", padding: "12px 24px" }}>
              Submit Gala Entry Request →
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

