import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <div className="auth-header">
        <Link href="https://www.aquateamhub.com" className="auth-brand">
          AquaTeam<span>Hub</span>
        </Link>
        <p className="muted" style={{ fontSize: "12px", margin: 0 }}>
          Central Identity &amp; Account Recovery
        </p>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          Enter your registered email address to receive password reset instructions.
        </p>

        <form action="/sign-in?message=If+an+account+exists+for+that+email,+reset+instructions+have+been+sent" className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="coach@club.org or parent@gmail.com"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: "8px" }}>
            Send Recovery Link →
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: "24px" }}>
          Remembered your password?{" "}
          <Link href="/sign-in">
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}

