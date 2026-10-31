"use client";

import { authClient } from "../lib/auth-client";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "https://auth.aquateamhub.com";

export function SignOutButton() {
  return (
    <button
      className="button-secondary"
      type="button"
      onClick={async () => {
        await authClient.signOut();
        window.location.assign(`${AUTH_URL}/sign-in`);
      }}
    >
      Sign out
    </button>
  );
}
