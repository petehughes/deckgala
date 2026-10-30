import Link from "next/link";
import { handleSignIn } from "../actions";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; returnTo?: string; callbackUrl?: string }>;
}) {
  const { error, message, returnTo, callbackUrl } = await searchParams;
  const effectiveCallback = callbackUrl || returnTo || "";

  return (
    <main className="auth-shell">
      <div className="auth-header">
        <Link href="https://www.aquateamhub.com" className="auth-brand">
          AquaTeam<span>Hub</span>
        </Link>
        <p className="muted" style={{ fontSize: "12px", margin: 0 }}>
          Central Identity &amp; Cross-Subdomain Authentication
        </p>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">
          Access your swimming dashboard, club operations, or live galas.
        </p>

        {error && (
          <div className="error-banner" style={{ marginBottom: "16px" }}>
            {decodeURIComponent(error)}
          </div>
        )}

        {message && (
          <div className="success-banner" style={{ marginBottom: "16px" }}>
            {decodeURIComponent(message)}
          </div>
        )}

        <form action={handleSignIn} className="auth-form">
          <input type="hidden" name="callbackUrl" value={effectiveCallback} />

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="coach@club.org or parent@gmail.com"
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="password">Password</label>
              <Link
                href="/forgot-password"
                style={{ fontSize: "11px", color: "var(--accent-cyan)", textDecoration: "none" }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: "8px" }}>
            Sign In to AquaTeamHub →
          </button>
        </form>

        <div className="auth-divider">
          <span>or sign in with</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <a
            href="/api/auth/signin/google"
            className="btn-secondary"
          >
            Google
          </a>
          <a
            href="/api/auth/signin/apple"
            className="btn-secondary"
          >
            Apple
          </a>
        </div>

        <div className="auth-footer" style={{ marginTop: "24px" }}>
          Don&apos;t have an account?{" "}
          <Link href={`/sign-up${effectiveCallback ? `?callbackUrl=${encodeURIComponent(effectiveCallback)}` : ""}`}>
            Create Account
          </Link>
        </div>
      </div>

      <div className="portal-pills">
        <Link href="https://my.aquateamhub.com" className="portal-pill">
          🏊 Parents &amp; Swimmers PWA (my)
        </Link>
        <Link href="https://myclub.aquateamhub.com" className="portal-pill">
          📋 Club Staff Admin (myclub)
        </Link>
        <Link href="https://results.aquateamhub.com" className="portal-pill">
          ⏱ Live Results
        </Link>
      </div>
    </main>
  );
}
