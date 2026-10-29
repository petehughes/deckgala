"use client";

import { useActionState } from "react";
import { createClubInvitation, type InvitationActionState } from "./actions";

const initialState: InvitationActionState = { url: null, error: null };

export function InviteForm() {
  const [state, action, pending] = useActionState(createClubInvitation, initialState);
  return (
    <div>
      <form action={action}>
        <label className="invite-role">Role
          <select name="role" defaultValue="COACH">
            <option value="COACH">Coach</option>
            <option value="TIMEKEEPER">Timekeeper</option>
            <option value="PARENT">Parent</option>
          </select>
        </label>
        <button className="button-secondary" type="submit" disabled={pending}>
          {pending ? "Creating link…" : "Create invitation link"}
        </button>
      </form>
      {state.url && <label className="invite-link">Share this link within your club<input readOnly value={state.url} onFocus={(event) => event.currentTarget.select()} /></label>}
      {state.error && <p className="notice-error" role="alert">{state.error}</p>}
    </div>
  );
}
