import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { linkSwimmerProfile } from "../actions";

export const dynamic = "force-dynamic";

export default async function LinkSwimmerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in?callbackUrl=/link-swimmer");
  }

  const { error, message } = await searchParams;

  const existingLinks = await prisma.parentSwimmerLink.findMany({
    where: { userId: session.user.id },
    include: {
      swimmer: {
        include: { club: true, squadRel: true },
      },
    },
  });

  return (
    <main className="auth-shell" style={{ maxWidth: "560px" }}>
      <div className="auth-header">
        <Link href="https://www.aquateamhub.com" className="auth-brand">
          AquaTeam<span>Hub</span>
        </Link>
        <p className="muted" style={{ fontSize: "12px", margin: 0 }}>
          Parent &amp; Swimmer Profile Linking Hub
        </p>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Link Swimmer Profile</h1>
        <p className="auth-subtitle">
          Connect your account to your children&apos;s swimmer profiles to view personal bests, track training schedules, and enter club galas.
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

        {existingLinks.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "10px" }}>
              Already Linked Swimmers ({existingLinks.length})
            </h2>
            <div style={{ display: "grid", gap: "8px" }}>
              {existingLinks.map((link) => (
                <div
                  key={link.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "rgba(11, 21, 40, 0.7)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                      {link.swimmer.firstName} {link.swimmer.lastName}
                    </strong>
                    <div className="muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                      {link.swimmer.club.name} • {link.swimmer.squadRel?.name || "Unassigned Squad"} • {link.relationship}
                    </div>
                  </div>
                  <span className="status" style={{ fontSize: "11px" }}>
                    ✓ Linked
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form action={linkSwimmerProfile} className="auth-form">
          <div className="form-group">
            <label htmlFor="governingBodyId">Swim England Number (or ID)</label>
            <input
              id="governingBodyId"
              name="governingBodyId"
              required
              placeholder="e.g. 1234567"
            />
            <span className="muted" style={{ fontSize: "11px" }}>
              Found on your swimmer&apos;s British Swimming rankings or club registration card.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="relationship">Your Relationship to Swimmer</label>
            <select id="relationship" name="relationship" defaultValue="MOTHER">
              <option value="MOTHER">Mother</option>
              <option value="FATHER">Father</option>
              <option value="GUARDIAN">Legal Guardian</option>
              <option value="OTHER">Other / Family Representative</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
              <input type="checkbox" name="isPrimaryContact" value="true" defaultChecked style={{ width: "auto" }} />
              I am the primary emergency and meet contact for this swimmer
            </label>
            <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
              <input type="checkbox" name="canEnterGalas" value="true" defaultChecked style={{ width: "auto" }} />
              Authorized to submit gala entry requests and pay meet entry fees
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: "12px" }}>
            Verify &amp; Link Swimmer →
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: "20px" }}>
          <Link href="https://my.aquateamhub.com/my-swimmers">
            ← Continue to Parent &amp; Swimmer PWA
          </Link>
        </div>
      </div>
    </main>
  );
}

