import Link from "next/link";
import { getParentContext } from "../../lib/parent-context";
import { setActiveSwimmerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function MySwimmersPage() {
  const { linkedSwimmers, activeSwimmer } = await getParentContext();

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Family Roster</p>
          <h1>My Swimmers</h1>
          <p className="muted">
            Manage your linked children, switch the active profile, and configure meet entry authorizations.
          </p>
        </div>

        <Link
          href="https://auth.deckgala.com/link-swimmer"
          className="btn-primary"
        >
          + Link Another Child
        </Link>
      </section>

      {linkedSwimmers.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p className="muted" style={{ marginBottom: "16px" }}>
            No swimmer profiles linked yet. Connect your child using their Swim England number.
          </p>
          <Link href="https://auth.deckgala.com/link-swimmer" className="btn-primary" style={{ display: "inline-flex" }}>
            🔗 Link Swimmer Now →
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {linkedSwimmers.map((swimmer) => {
            const isActive = activeSwimmer?.id === swimmer.id;
            return (
              <div
                key={swimmer.id}
                className="panel"
                style={{
                  borderColor: isActive ? "var(--accent-cyan)" : undefined,
                  boxShadow: isActive ? "var(--glow-cyan)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <h2 style={{ margin: 0, fontSize: "22px" }}>
                        {swimmer.firstName} {swimmer.lastName}
                      </h2>
                      {isActive && (
                        <span className="status-badge">
                          ✓ Active Swimmer
                        </span>
                      )}
                    </div>
                    <p className="muted" style={{ fontSize: "13px", margin: "0 0 12px" }}>
                      {swimmer.clubName} • {swimmer.squadName || "Unassigned Squad"} • {swimmer.relationship} Profile
                    </p>

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-secondary)" }}>
                      <div>
                        <span className="muted">Swim England ID: </span>
                        <strong style={{ color: "var(--text-primary)" }}>{swimmer.governingBodyId || "None"}</strong>
                      </div>
                      <div>
                        <span className="muted">DOB: </span>
                        <strong style={{ color: "var(--text-primary)" }}>
                          {swimmer.dateOfBirth
                            ? new Date(swimmer.dateOfBirth).toLocaleDateString("en-GB")
                            : "Not Recorded"}
                        </strong>
                      </div>
                      <div>
                        <span className="muted">Gender: </span>
                        <strong style={{ color: "var(--text-primary)" }}>{swimmer.gender || "Open"}</strong>
                      </div>
                      <div>
                        <span className="muted">Meet Entry Authorized: </span>
                        <strong style={{ color: swimmer.canEnterGalas ? "var(--color-pace-green)" : "var(--color-start-coral)" }}>
                          {swimmer.canEnterGalas ? "Yes" : "No"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {!isActive && (
                      <form action={setActiveSwimmerAction}>
                        <input type="hidden" name="swimmerId" value={swimmer.id} />
                        <input type="hidden" name="returnTo" value="/my-swimmers" />
                        <button type="submit" className="btn-secondary" style={{ fontSize: "12px" }}>
                          Set as Active
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/galas`}
                      className="btn-primary"
                      style={{ fontSize: "12px", padding: "8px 14px" }}
                    >
                      Enter Galas →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

