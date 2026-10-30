import { isStaffRole, type ClubRole } from "@aquateamhub/database";

export interface RedirectResolverOptions {
  user: {
    id: string;
    email: string;
  };
  memberships: Array<{
    role: ClubRole | string;
    clubId: string;
  }>;
  guardianLinksCount?: number;
  callbackUrl?: string | null;
  envUrls?: {
    myclubUrl?: string;
    myUrl?: string;
    resultsUrl?: string;
    wwwUrl?: string;
  };
}

export interface ResolvedRedirect {
  targetUrl: string;
  portal: "MYCLUB" | "MY" | "RESULTS" | "WWW";
  reason: string;
}

const DEFAULT_MYCLUB_URL = process.env.MYCLUB_URL || "https://myclub.aquateamhub.com";
const DEFAULT_MY_URL = process.env.MY_URL || "https://my.aquateamhub.com";

/**
 * Validates that a callback URL is safe (either a local path or an approved AquaTeamHub domain)
 * to protect against open redirect vulnerabilities.
 */
export function isSafeCallbackUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Local relative paths starting with / (excluding // which browser treats as protocol-relative)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // Allow official production domains or local development ports
    if (
      hostname === "aquateamhub.com" ||
      hostname.endsWith(".aquateamhub.com") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Resolves intelligent role-based redirection post-login:
 * - Verified Staff (Admin, Coach, Timekeeper, Official) -> myclub.aquateamhub.com
 * - Parents & Swimmers -> my.aquateamhub.com
 * - Safe explicit callback URLs are respected when provided
 */
export function resolveAuthRedirect(options: RedirectResolverOptions): ResolvedRedirect {
  const {
    memberships,
    guardianLinksCount = 0,
    callbackUrl,
    envUrls = {},
  } = options;

  const myclubUrl = envUrls.myclubUrl || DEFAULT_MYCLUB_URL;
  const myUrl = envUrls.myUrl || DEFAULT_MY_URL;

  // 1. If a valid, safe callbackUrl was explicitly requested, prioritize it
  if (callbackUrl && isSafeCallbackUrl(callbackUrl)) {
    let portal: "MYCLUB" | "MY" | "RESULTS" | "WWW" = "MY";
    if (callbackUrl.includes("myclub.") || callbackUrl.includes(":3000")) {
      portal = "MYCLUB";
    } else if (callbackUrl.includes("results.")) {
      portal = "RESULTS";
    } else if (callbackUrl.includes("www.")) {
      portal = "WWW";
    }

    return {
      targetUrl: callbackUrl,
      portal,
      reason: "Safe explicit callback URL parameter",
    };
  }

  // 2. Check for club staff roles (Admin, Coach, Timekeeper, Official)
  const hasStaffRole = memberships.some((m) => isStaffRole(m.role as ClubRole));
  if (hasStaffRole) {
    return {
      targetUrl: myclubUrl,
      portal: "MYCLUB",
      reason: "Verified club staff credentials (Admin / Coach / Official)",
    };
  }

  // 3. Check for parent role or linked swimmers
  const hasParentRole = memberships.some((m) => m.role === "PARENT");
  if (hasParentRole || guardianLinksCount > 0) {
    return {
      targetUrl: myUrl,
      portal: "MY",
      reason: "Parent / Swimmer family profile credentials",
    };
  }

  // 4. Default for new registrations / unassociated accounts
  return {
    targetUrl: myUrl,
    portal: "MY",
    reason: "Standard user account (directed to swimmer & parent PWA)",
  };
}

