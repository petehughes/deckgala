export interface EventEligibilityCheck {
  isEligible: boolean;
  status: "QUALIFIED" | "TOO_FAST" | "TOO_SLOW" | "NO_TIME_ALLOWED" | "NO_TIME_NOT_ALLOWED";
  pbTimeMs: number | null;
  qualifyingTimeMs: number | null;
  cutoffTimeMs: number | null;
  reason: string;
}

/**
 * Checks eligibility of a swimmer's Personal Best for a specific race event.
 */
export function checkEventEligibility(
  pbTimeMs: number | null | undefined,
  qualifyingTimeMs: number | null | undefined,
  cutoffTimeMs: number | null | undefined,
  allowNoTime: boolean = true
): EventEligibilityCheck {
  if (pbTimeMs == null || pbTimeMs <= 0) {
    if (allowNoTime) {
      return {
        isEligible: true,
        status: "NO_TIME_ALLOWED",
        pbTimeMs: null,
        qualifyingTimeMs: qualifyingTimeMs ?? null,
        cutoffTimeMs: cutoffTimeMs ?? null,
        reason: "No entry time on record; No Time (NT) entries permitted.",
      };
    }
    return {
      isEligible: false,
      status: "NO_TIME_NOT_ALLOWED",
      pbTimeMs: null,
      qualifyingTimeMs: qualifyingTimeMs ?? null,
      cutoffTimeMs: cutoffTimeMs ?? null,
      reason: "An official entry time is required for this event (NT not permitted).",
    };
  }

  // If cutoffTimeMs ("no faster than") is set, swimmer must NOT be faster (i.e. pbTimeMs >= cutoffTimeMs)
  if (cutoffTimeMs != null && pbTimeMs < cutoffTimeMs) {
    return {
      isEligible: false,
      status: "TOO_FAST",
      pbTimeMs,
      qualifyingTimeMs: qualifyingTimeMs ?? null,
      cutoffTimeMs,
      reason: "Time is faster than event cutoff upper limit.",
    };
  }

  // If qualifyingTimeMs ("equal or faster than") is set, swimmer must be <= qualifyingTimeMs
  if (qualifyingTimeMs != null && pbTimeMs > qualifyingTimeMs) {
    return {
      isEligible: false,
      status: "TOO_SLOW",
      pbTimeMs,
      qualifyingTimeMs,
      cutoffTimeMs: cutoffTimeMs ?? null,
      reason: "Time does not meet the minimum qualifying cut.",
    };
  }

  return {
    isEligible: true,
    status: "QUALIFIED",
    pbTimeMs,
    qualifyingTimeMs: qualifyingTimeMs ?? null,
    cutoffTimeMs: cutoffTimeMs ?? null,
    reason: "Eligible entry time.",
  };
}

