import Link from "next/link";
import { handleSignUp } from "../actions";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  return (
    <main className="auth-shell">
      <div className="auth-header">
        <Link href="https://www.deckgala.com" className="auth-brand">
          Deck<span>Gala</span>
        </Link>
        <p className="muted" style={{ fontSize: "12px", margin: 0 }}>
          Central Identity &amp; Cross-Subdomain Authentication
        </p>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">
          Join DeckGala to manage your swimmer, enter meets, or administer your club.
        </p>

        {error && (
          <div className="error-banner" style={{ marginBottom: "16px" }}>
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={handleSignUp} className="auth-form">
          <input type="hidden" name="callbackUrl" value={callbackUrl || ""} />

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="e.g. Sarah Jenkins"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="sarah@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="accountType">I am a</label>
            <select id="accountType" name="accountType" defaultValue="PARENT">
              <option value="PARENT">Swimmer or Parent / Guardian</option>
              <option value="STAFF">Club Coach, Administrator or Official</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (8+ characters)</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: "8px" }}>
            Create Account →
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: "24px" }}>
          Already have an account?{" "}
          <Link href={`/sign-in${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}>
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}

