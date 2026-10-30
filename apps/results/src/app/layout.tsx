import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Swim Results | AquaTeamHub",
  description: "Follow published gala events and lane-by-lane results live with AquaTeamHub.",
};

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" role="img" aria-label="AquaTeamHub mark">
      <circle cx="24" cy="24" r="20" fill="#16233b" stroke="#8ca0ba" strokeWidth="2" />
      <path d="M24 4a20 20 0 0 0 0 40V4Z" fill="#00e5ff" />
      <path d="M24 4a20 20 0 0 1 0 40V4Z" fill="#ff5a36" />
      <circle cx="24" cy="24" r="12" fill="#0b1528" stroke="#f4f7fb" strokeWidth="1.5" />
      <path d="M15 20h18M15 24h18M15 28h18" stroke="#00e5ff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M27 20h6M27 24h6M27 28h6" stroke="#ff5a36" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a className="brand" href="/" aria-label="AquaTeamHub live results home">
            <BrandMark />
            <span>AquaTeam<span className="brand-accent">Hub</span></span>
          </a>
          <span className="topbar-label">SPECTATOR RESULTS</span>
        </header>
        <main className="page-shell">{children}</main>
        <footer className="footer">
          <span>Times are unofficial unless marked otherwise by the meet officials.</span>
          <span>Powered by <strong>AquaTeamHub</strong></span>
        </footer>
      </body>
    </html>
  );
}
