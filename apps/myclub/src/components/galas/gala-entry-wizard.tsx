"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { formatSwimTime } from "../../lib/qualifying-standards";
import { submitGalaEntry } from "../../app/actions";

export interface WizardSwimmer {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  age: number;
  dateOfBirthFormatted: string;
  personalBests: Array<{
    stroke: string;
    distance: number;
    course: string;
    timeMs: number;
  }>;
}

export interface WizardEvent {
  id: string;
  eventNumber: number;
  sessionNumber: number;
  sessionEventNumber: number | null;
  name: string;
  distance: number;
  stroke: string;
  gender: string | null;
  ageGroup: string | null;
  minAge: number | null;
  maxAge: number | null;
  feePence: number;
  qualifyingTimeMs: number | null;
  cutoffTimeMs: number | null;
  allowNoTime: boolean;
}

export interface GalaEntryWizardProps {
  galaId: string;
  galaName: string;
  venueName: string;
  course: string;
  startsAtFormatted: string;
  entryFeePence: number;
  defaultEventFeePence: number;
  swimmers: WizardSwimmer[];
  events: WizardEvent[];
  existingSelections?: Record<string, string[]>;
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function GalaEntryWizard({
  galaId,
  galaName,
  venueName,
  course,
  startsAtFormatted,
  entryFeePence,
  defaultEventFeePence,
  swimmers,
  events,
  existingSelections = {},
}: GalaEntryWizardProps) {
  const paymentMethodId = useId();

  // Active selected swimmers
  const [selectedSwimmerIds, setSelectedSwimmerIds] = useState<string[]>(
    swimmers.map((s) => s.id),
  );

  // Selected event IDs per swimmer: { [swimmerId]: string[] }
  const [selectedEvents, setSelectedEvents] = useState<Record<string, string[]>>(
    existingSelections,
  );

  // Filter toggle: show only qualified vs show all
  const [showOnlyQualified, setShowOnlyQualified] = useState<boolean>(true);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"POOL_DESK" | "STRIPE" | "MOCK_SKIP">(
    "MOCK_SKIP",
  );

  // Active child tab
  const [activeChildId, setActiveChildId] = useState<string>(
    swimmers[0]?.id || "",
  );

  const activeSwimmer = swimmers.find((s) => s.id === activeChildId) || swimmers[0];

  // Helper to evaluate eligibility of a swimmer for an event
  function evaluateEligibility(swimmer: WizardSwimmer, event: WizardEvent) {
    // 1. Gender check
    if (event.gender && swimmer.gender) {
      if (event.gender === "FEMALE" && swimmer.gender !== "FEMALE") {
        return { isEligible: false, reason: "Girls / Women only" };
      }
      if (event.gender === "MALE" && swimmer.gender !== "MALE") {
        return { isEligible: false, reason: "Boys / Men only" };
      }
    }

    // 2. Age check
    if (event.minAge !== null && swimmer.age < event.minAge) {
      return { isEligible: false, reason: `Minimum age is ${event.minAge} (Swimmer is ${swimmer.age})` };
    }
    if (event.maxAge !== null && swimmer.age > event.maxAge) {
      return { isEligible: false, reason: `Maximum age is ${event.maxAge} (Swimmer is ${swimmer.age})` };
    }

    // 3. Time qualification check
    const pb = swimmer.personalBests.find(
      (p) => p.stroke === event.stroke && p.distance === event.distance && p.course === course,
    );

    if (!pb) {
      if (event.allowNoTime) {
        return {
          isEligible: true,
          status: "CONSIDERATION" as const,
          reason: "Eligible under No Time (NT) allowance",
          seedTime: "NT",
        };
      }
      return { isEligible: false, reason: "Requires qualifying time (No NT entries permitted)" };
    }

    // Check upper cut (must be <= qualifying time)
    if (event.qualifyingTimeMs !== null && pb.timeMs > event.qualifyingTimeMs) {
      return {
        isEligible: false,
        reason: `PB (${formatSwimTime(pb.timeMs)}) is slower than cut (${formatSwimTime(event.qualifyingTimeMs)})`,
      };
    }

    // Check lower cutoff (must be >= cutoff time in developmental meets)
    if (event.cutoffTimeMs !== null && pb.timeMs < event.cutoffTimeMs) {
      return {
        isEligible: false,
        reason: `PB (${formatSwimTime(pb.timeMs)}) is faster than cutoff (${formatSwimTime(event.cutoffTimeMs)})`,
      };
    }

    return {
      isEligible: true,
      status: "QUALIFIED" as const,
      reason: `Qualified with active PB: ${formatSwimTime(pb.timeMs)}`,
      seedTime: formatSwimTime(pb.timeMs),
    };
  }

  // Toggle swimmer inclusion
  function toggleSwimmer(swimmerId: string) {
    if (selectedSwimmerIds.includes(swimmerId)) {
      if (selectedSwimmerIds.length === 1) return; // Keep at least one
      setSelectedSwimmerIds(selectedSwimmerIds.filter((id) => id !== swimmerId));
      if (activeChildId === swimmerId) {
        const next = selectedSwimmerIds.find((id) => id !== swimmerId);
        if (next) setActiveChildId(next);
      }
    } else {
      setSelectedSwimmerIds([...selectedSwimmerIds, swimmerId]);
      setActiveChildId(swimmerId);
    }
  }

  // Toggle an event selection for a swimmer
  function toggleEvent(swimmerId: string, eventId: string) {
    const current = selectedEvents[swimmerId] || [];
    if (current.includes(eventId)) {
      setSelectedEvents({
        ...selectedEvents,
        [swimmerId]: current.filter((id) => id !== eventId),
      });
    } else {
      setSelectedEvents({
        ...selectedEvents,
        [swimmerId]: [...current, eventId],
      });
    }
  }

  // Calculate fees
  let totalFeePence = 0;
  const costBreakdown: Array<{
    swimmerId: string;
    swimmerName: string;
    baseFee: number;
    eventsCount: number;
    eventsTotal: number;
    swimmerTotal: number;
  }> = [];

  for (const sId of selectedSwimmerIds) {
    const sw = swimmers.find((s) => s.id === sId);
    if (!sw) continue;

    const evIds = selectedEvents[sId] || [];
    let eventsTotal = 0;
    for (const eId of evIds) {
      const ev = events.find((e) => e.id === eId);
      eventsTotal += ev?.feePence ?? defaultEventFeePence;
    }

    // Swimmer only incurs base fee if they enter at least 1 event
    const baseFee = evIds.length > 0 ? entryFeePence : 0;
    const swimmerTotal = baseFee + eventsTotal;
    totalFeePence += swimmerTotal;

    costBreakdown.push({
      swimmerId: sw.id,
      swimmerName: `${sw.firstName} ${sw.lastName}`,
      baseFee,
      eventsCount: evIds.length,
      eventsTotal,
      swimmerTotal,
    });
  }

  // Prepare submission payload
  const submissionPayload = selectedSwimmerIds.map((sId) => ({
    swimmerId: sId,
    eventIds: selectedEvents[sId] || [],
  })).filter((item) => item.eventIds.length > 0);

  const totalSelectedRaces = submissionPayload.reduce((acc, p) => acc + p.eventIds.length, 0);

  if (swimmers.length === 0) {
    return (
      <div className="empty">
        No eligible swimmers found under your account. Please add or link a swimmer first.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Step 1: Select Swimmers */}
      <section className="panel" aria-labelledby="step1-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 1 of 4</p>
            <h2 id="step1-title">Select Swimmers to Enter</h2>
          </div>
        </div>
        <p className="muted" style={{ marginBottom: "16px" }}>
          Select which children you are registering for <strong>{galaName}</strong> at {venueName} ({startsAtFormatted}).
        </p>

        <div className="child-selector-tabs">
          {swimmers.map((swimmer) => {
            const isChecked = selectedSwimmerIds.includes(swimmer.id);
            const isCurrentTab = activeChildId === swimmer.id;
            const enteredCount = (selectedEvents[swimmer.id] || []).length;

            return (
              <div
                key={swimmer.id}
                className={`child-tab ${isCurrentTab ? "child-tab-active" : ""}`}
                onClick={() => setActiveChildId(swimmer.id)}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSwimmer(swimmer.id);
                  }}
                  className="event-entry-checkbox"
                />
                <div>
                  <strong>{swimmer.firstName} {swimmer.lastName}</strong>
                  <small style={{ display: "block", color: "var(--text-muted)" }}>
                    Age {swimmer.age} · {enteredCount} {enteredCount === 1 ? "Event" : "Events"} Selected
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 2: Event Selection for Active Swimmer */}
      {activeSwimmer && (
        <section className="panel" aria-labelledby="step2-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 2 of 4 · Event Selection</p>
              <h2 id="step2-title">
                Available Events for {activeSwimmer.firstName} {activeSwimmer.lastName} (Age {activeSwimmer.age})
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label className="checkbox-label" style={{ fontSize: "12px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showOnlyQualified}
                  onChange={(e) => setShowOnlyQualified(e.target.checked)}
                />
                Hide Ineligible Events
              </label>
            </div>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {events.map((event) => {
              const evalResult = evaluateEligibility(activeSwimmer, event);
              const isSelected = (selectedEvents[activeSwimmer.id] || []).includes(event.id);

              if (showOnlyQualified && !evalResult.isEligible) {
                return null;
              }

              const eventFee = event.feePence ?? defaultEventFeePence;

              return (
                <div
                  key={event.id}
                  className="event-entry-card"
                  style={{
                    opacity: evalResult.isEligible ? 1 : 0.45,
                    borderLeft: isSelected ? "3px solid var(--accent-cyan)" : undefined,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!evalResult.isEligible}
                      onChange={() => toggleEvent(activeSwimmer.id, event.id)}
                      className="event-entry-checkbox"
                    />

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                          Ev #{event.eventNumber} · {event.name}
                        </strong>
                        <span className="muted" style={{ fontSize: "11px" }}>
                          (Session {event.sessionNumber})
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                        {evalResult.isEligible ? (
                          evalResult.status === "QUALIFIED" ? (
                            <span className="qualification-pill qual-qualified">
                              Qualified ({evalResult.seedTime})
                            </span>
                          ) : (
                            <span className="qualification-pill qual-consideration">
                              NT Allowed
                            </span>
                          )
                        ) : (
                          <span className="qualification-pill qual-not-qualified">
                            Not Qualified: {evalResult.reason}
                          </span>
                        )}

                        <span className="muted" style={{ fontSize: "12px" }}>
                          {evalResult.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className="mono-time" style={{ fontSize: "14px" }}>
                      {formatPence(eventFee)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 3: Cost Breakdown & Cart */}
      <section className="panel" aria-labelledby="step3-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 3 of 4</p>
            <h2 id="step3-title">Entry Summary & Fees</h2>
          </div>
        </div>

        <div className="cart-summary-card">
          {costBreakdown.map((row) => (
            <div key={row.swimmerId} className="cart-row">
              <div>
                <strong>{row.swimmerName}</strong>
                <small style={{ display: "block", color: "var(--text-muted)" }}>
                  Gala Base Fee ({formatPence(row.baseFee)}) + {row.eventsCount} Events ({formatPence(row.eventsTotal)})
                </small>
              </div>
              <span className="mono-time">{formatPence(row.swimmerTotal)}</span>
            </div>
          ))}

          <div className="cart-total-row">
            <span>Total Entry Cost</span>
            <span>{formatPence(totalFeePence)}</span>
          </div>
        </div>
      </section>

      {/* Step 4: Payment Confirmation & Submission */}
      <section className="panel" aria-labelledby="step4-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 4 of 4</p>
            <h2 id="step4-title">Payment Mode & Entry Submission</h2>
          </div>
        </div>
        <p className="muted">
          Choose your payment method or select &ldquo;Skip for Now&rdquo; to record entries immediately.
        </p>

        <form action={submitGalaEntry} className="payment-selector-group">
          <input type="hidden" name="galaId" value={galaId} />
          <input type="hidden" name="paymentMethod" value={paymentMethod} />
          <input type="hidden" name="entriesPayload" value={JSON.stringify(submissionPayload)} />

          <label htmlFor={`${paymentMethodId}-mock`} className="payment-option-label">
            <input
              id={`${paymentMethodId}-mock`}
              type="radio"
              name="paymentChoice"
              checked={paymentMethod === "MOCK_SKIP"}
              onChange={() => setPaymentMethod("MOCK_SKIP")}
            />
            <div>
              <strong>Skip Payment for Now / Record Entry Directly</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>
                Fast checkout for testing; marks registration confirmed immediately.
              </small>
            </div>
          </label>

          <label htmlFor={`${paymentMethodId}-pool`} className="payment-option-label">
            <input
              id={`${paymentMethodId}-pool`}
              type="radio"
              name="paymentChoice"
              checked={paymentMethod === "POOL_DESK"}
              onChange={() => setPaymentMethod("POOL_DESK")}
            />
            <div>
              <strong>Pay at Pool Desk / Club Dues Account</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>
                Submit entry request and settle total {formatPence(totalFeePence)} poolside or via invoice.
              </small>
            </div>
          </label>

          <label htmlFor={`${paymentMethodId}-stripe`} className="payment-option-label">
            <input
              id={`${paymentMethodId}-stripe`}
              type="radio"
              name="paymentChoice"
              checked={paymentMethod === "STRIPE"}
              onChange={() => setPaymentMethod("STRIPE")}
            />
            <div>
              <strong>Online Payment (Stripe / Credit & Debit Card)</strong>
              <small style={{ display: "block", color: "var(--text-muted)" }}>
                Secure instant checkout with card receipts.
              </small>
            </div>
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
            <Link href={`/galas/${galaId}`} className="button-secondary" style={{ textDecoration: "none" }}>
              ← Return to Gala Program
            </Link>

            <button
              type="submit"
              disabled={totalSelectedRaces === 0}
              style={{
                opacity: totalSelectedRaces === 0 ? 0.5 : 1,
                cursor: totalSelectedRaces === 0 ? "not-allowed" : "pointer",
              }}
            >
              {totalSelectedRaces === 0
                ? "Select at least 1 event"
                : `Submit Entry (${totalSelectedRaces} ${totalSelectedRaces === 1 ? "Race" : "Races"} · ${formatPence(totalFeePence)})`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

