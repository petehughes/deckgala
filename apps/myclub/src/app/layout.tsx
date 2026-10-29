import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeckGala Club Portal",
  description: "One club portal for every swimming club",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a className="brand" href="/">DeckGala <span>Club Portal</span></a>
          <span className="topbar-note">One portal · many clubs</span>
        </header>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
