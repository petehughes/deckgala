import type { ClubRole } from "@deckgala/database";
import { ClubSwitcher } from "../../app/club-switcher";
import { SignOutButton } from "../../app/sign-out-button";
import { RoleBadge } from "./role-badge";

export interface AppHeaderProps {
  user: {
    name?: string | null;
    email: string;
  };
  role: ClubRole;
  accessibleClubs: Array<{ clubId: string; club: { name: string } }>;
  activeClubId: string;
  isSuperAdmin?: boolean;
  lockedClubCount?: number;
  subscriptionActive?: boolean;
}

export function AppHeader({
  user,
  role,
  accessibleClubs,
  activeClubId,
  isSuperAdmin = false,
  lockedClubCount = 0,
  subscriptionActive = false,
}: AppHeaderProps) {
  return (
    <header className="app-shell-header">
      <div className="header-main-row">
        {/* Brand identity */}
        <div className="brand-group">
          <a href="/" className="brand-link" aria-label="DeckGala Home">
            {/* Precision chronometer split icon */}
            <svg
              className="brand-logo-svg"
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="16" cy="16" r="14" stroke="#1E3152" strokeWidth="2.5" />
              {/* Chronometer ticks */}
              <line x1="16" y1="2" x2="16" y2="5" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="27" x2="16" y2="30" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="16" x2="5" y2="16" stroke="#FF5A36" strokeWidth="2" strokeLinecap="round" />
              <line x1="27" y1="16" x2="30" y2="16" stroke="#FF5A36" strokeWidth="2" strokeLinecap="round" />
              {/* Cyan split wave */}
              <path
                d="M7 17C10 13 14 20 18 16C21 13 24 16 26 15"
                stroke="#00E5FF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Coral start accent */}
              <circle cx="16" cy="16" r="3" fill="#FF5A36" />
            </svg>
            <div className="brand-title">
              <span className="brand-title-deck">Deck</span>
              <span className="brand-title-gala">Gala</span>
              <span className="portal-sub-badge">MyClub</span>
            </div>
          </a>

          {/* Club Switcher dropdown with active role badge */}
          {accessibleClubs.length > 0 && (
            <div className="header-club-switcher">
              <ClubSwitcher clubs={accessibleClubs} selectedClubId={activeClubId} />
              <RoleBadge role={role} />
            </div>
          )}
        </div>

        {/* Global user tools & session actions */}
        <div className="header-actions">
          <nav className="header-utility-nav">
            <a href="/billing" className="header-link">
              Billing
            </a>
            {isSuperAdmin && (
              <a href="/platform" className="header-link platform-link-badge">
                Platform
              </a>
            )}
          </nav>

          <div className="user-profile-widget">
            <div className="user-meta">
              <span className="user-name">{user.name || user.email}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Global alert banner for locked clubs if applicable */}
      {lockedClubCount > 0 && !subscriptionActive && (
        <div className="global-alert-banner alert-warning">
          <span>
            ⚠️ {lockedClubCount} club workspace{lockedClubCount === 1 ? " is" : "s are"} locked above your free allowance.
          </span>
          <a href="/billing" className="alert-action-link">
            Review Billing Plan →
          </a>
        </div>
      )}
    </header>
  );
}

