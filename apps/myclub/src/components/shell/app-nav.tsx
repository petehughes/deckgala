"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ClubRole } from "@deckgala/database";

interface AppNavProps {
  role: ClubRole;
}

export function AppNav({ role }: AppNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/roster", label: "Swimmers & Roster", icon: "🏊" },
    { href: "/squads", label: "Squads", icon: "👥" },
    { href: "/galas", label: "Gala Meets", icon: "⏱️" },
  ];

  if (role === "PARENT") {
    navItems.push({ href: "/my-swimmers", label: "My Swimmers", icon: "👨‍👩‍👧" });
  }

  if (role === "ADMIN") {
    navItems.push({ href: "/settings/club", label: "Club Settings", icon: "⚙️" });
  }

  return (
    <nav className="app-nav-bar" aria-label="Main Navigation">
      <div className="app-nav-scroll">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "nav-item-active" : ""}`}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

