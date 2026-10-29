import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeckGala | Offline deck timing. Seamless meet management.",
  description:
    "Cable-free swim timing for the pool deck, plus connected club and gala management for every lane.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://deckgala.com"),
  openGraph: {
    title: "DeckGala",
    description: "Offline deck timing. Seamless meet management.",
    type: "website",
  },
};

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" role="img" aria-label="DeckGala mark">
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
        <header className="site-header">
          <a className="brand" href="/" aria-label="DeckGala home">
            <BrandMark />
            <span>Deck<span className="brand-accent">Gala</span></span>
          </a>
          <nav aria-label="Main navigation">
            <a href="#platform">Platform</a>
            <a href="#workflow">How it works</a>
            <a href="#clubs">For clubs</a>
          </nav>
          <a className="button button-small" href="#platform">Explore DeckGala <span aria-hidden="true">↗</span></a>
        </header>
        {children}
        <footer className="site-footer">
          <a className="brand footer-brand" href="/"><BrandMark /><span>Deck<span className="brand-accent">Gala</span></span></a>
          <p>Built for the deck. Ready for the next heat.</p>
          <span>© {new Date().getFullYear()} DeckGala</span>
        </footer>
      </body>
    </html>
  );
}
