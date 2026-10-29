import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeckGala MyClub",
  description: "Club membership and gala administration",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a className="brand" href="/">DeckGala <span>MyClub</span></a>
          <span className="topbar-note">Club administration</span>
        </header>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
