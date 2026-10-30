import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { getSession, isPlatformAdmin } from "../lib/session";
import { getAccessibleUserClubs } from "../lib/club-context";
import { AppHeader } from "../components/shell/app-header";
import { AppNav } from "../components/shell/app-nav";

export const metadata: Metadata = {
  title: "AquaTeamHub Club Portal",
  description: "One club portal for every swimming club",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  let headerElement = (
    <header className="topbar">
      <a className="brand" href="/">
        AquaTeamHub <span>Club Portal</span>
      </a>
      <span className="topbar-note">One portal · many clubs</span>
    </header>
  );

  let navElement: React.ReactNode = null;

  if (session) {
    const { accessible, lockedClubCount, subscriptionActive } = await getAccessibleUserClubs(
      session.user.id,
    );
    const cookieStore = await cookies();
    const selectedId = cookieStore.get("aquateamhub_active_club")?.value;
    const membership = accessible.find(({ clubId }) => clubId === selectedId) ?? accessible[0];

    if (membership) {
      headerElement = (
        <AppHeader
          user={session.user}
          role={membership.role}
          accessibleClubs={accessible}
          activeClubId={membership.clubId}
          isSuperAdmin={isPlatformAdmin(session.user.email)}
          lockedClubCount={lockedClubCount}
          subscriptionActive={subscriptionActive}
        />
      );
      navElement = <AppNav role={membership.role} />;
    }
  }

  return (
    <html lang="en">
      <body>
        {headerElement}
        {navElement}
        <main>{children}</main>
      </body>
    </html>
  );
}
