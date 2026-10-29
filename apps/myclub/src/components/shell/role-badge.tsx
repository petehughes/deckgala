import type { ClubRole } from "@deckgala/database";

export function RoleBadge({ role }: { role: ClubRole }) {
  const roleStyles: Record<ClubRole, { label: string; className: string }> = {
    ADMIN: { label: "Admin", className: "role-badge-admin" },
    COACH: { label: "Coach", className: "role-badge-coach" },
    TIMEKEEPER: { label: "Timekeeper", className: "role-badge-timekeeper" },
    PARENT: { label: "Parent", className: "role-badge-parent" },
  };

  const config = roleStyles[role] ?? { label: role, className: "role-badge-default" };

  return <span className={`role-badge ${config.className}`}>{config.label}</span>;
}

