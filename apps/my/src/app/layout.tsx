import type { Metadata } from "next";
import Link from "next/link";
import { getParentContext } from "../lib/parent-context";
import { setActiveSwimmerAction } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "AquaTeamHub | Swimmer & Parent Portal",
  description: "Progressive Web App for swimming families: personal bests, training schedules, and gala meet entries.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0B1528",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getParentContext();
  const { linkedSwimmers, activeSwimmer } = context;

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" className="brand">
              AquaTeam<span>Hub</span> <small style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: 700 }}>FAMILY</small>
            </Link>

            {linkedSwimmers.length > 0 && (
              <div className="family-bar">
                {linkedSwimmers.map((s) => {
                  const isActive = activeSwimmer?.id === s.id;
                  return (
                    <form key={s.id} action={setActiveSwimmerAction} style={{ display: "inline" }}>
                      <input type="hidden" name="swimmerId" value={s.id} />
                      <button
                        type="submit"
                        className={`swimmer-pill ${isActive ? "swimmer-pill--active" : ""}`}
                        title={`Switch active swimmer to ${s.firstName}`}
                      >
                        🏊 {s.firstName} {s.lastName[0]}.
                      </button>
                    </form>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="https://auth.aquateamhub.com/link-swimmer"
              className="btn-secondary"
              style={{ fontSize: "11px", padding: "6px 10px" }}
            >
              + Link Child
            </Link>
            <a
              href="https://auth.aquateamhub.com/sign-in"
              className="muted"
              style={{ fontSize: "12px", textDecoration: "none" }}
            >
              Account
            </a>
          </div>
        </header>

        {children}

        {/* Mobile & PWA Bottom Navigation Bar */}
        <nav className="bottom-nav">
          <Link href="/" className="nav-item">
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </Link>
          <Link href="/my-swimmers" className="nav-item">
            <span className="nav-icon">🏊</span>
            <span>Swimmers</span>
          </Link>
          <Link href="/schedule" className="nav-item">
            <span className="nav-icon">📅</span>
            <span>Schedule</span>
          </Link>
          <Link href="/galas" className="nav-item">
            <span className="nav-icon">🏆</span>
            <span>Galas</span>
          </Link>
          <Link href="/personal-bests" className="nav-item">
            <span className="nav-icon">⚡</span>
            <span>PBs</span>
          </Link>
        </nav>

        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) { /* PWA registered */ },
                    function(err) { /* error */ }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

