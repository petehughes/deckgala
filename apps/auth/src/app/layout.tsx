import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeckGala Central Identity & Authentication",
  description: "Unified cross-subdomain authentication authority for DeckGala apps and portals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

