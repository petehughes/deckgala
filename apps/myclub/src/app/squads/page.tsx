import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignSwimmerToSquad,
  cancelSquadPromotion,
  createSquad,
  deleteSquad,
  removeSwimmerFromSquad,
  scheduleSquadPromotion,
  updateSquad,
} from "../actions";
import { getActiveClub } from "../../lib/club-context";
import { prisma } from "../../lib/prisma";
import type { ScheduledPromotion } from "../../lib/squad-service";

export const dynamic = "force-dynamic";

export default async function SquadsPage({
  searchParams,
}: {
  searchParams: Promise<{ editSquad?: string }>;
}) {
  const { editSquad: editSquadId } = await searchParams;
  const { clubId, role } = await getActiveClub();

  const [club, squads, allSwimmers] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true, customBranding: true },
    }),
    prisma.squad.findMany({
      where: { clubId },
      include: {
        swimmers: {
          include: {
            personalBests: true,
          },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.swimmer.findMany({
      where: { clubId },
      include: {
        squadRel: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  if (!club) notFound();

  const canManage = role === "ADMIN" || role === "COACH";

  // Identify unassigned swimmers
  const unassignedSwimmers = allSwimmers.filter(
    (swimmer) => !swimmer.squadId && !squads.some((s) => s.name === swimmer.squad),
  );

  // Extract scheduled promotions from club customBranding
  const branding = (club.customBranding as Record<string, unknown>) || {};
  const rawPromotions = Array.isArray(branding.scheduledPromotions)
    ? (branding.scheduledPromotions as ScheduledPromotion[])
    : [];

  const scheduledPromotions = rawPromotions.filter((p) => p.status === "SCHEDULED");

  return (
    <div className="page-shell">
      {/* Hero Section matching Dashboard, Swimmers & Roster */}
      <section className="hero">
        <div>
          <p className="eyebrow">Training & Development</p>
          <h1>Squads & Movements</h1>
          <p className="muted">
            Organize training groups, assign swimmers, and schedule seasonal squad promotions.
          </p>
        </div>
        <div className="summary">
          <div>
            <strong>{squads.length}</strong>
            <span>Active Squads</span>
          </div>
          <div>
            <strong>{allSwimmers.length - unassignedSwimmers.length}</strong>
            <span>Assigned</span>
          </div>
          <div>
            <strong>{unassignedSwimmers.length}</strong>
            <span>Unassigned</span>
          </div>
          <div>
            <strong>{scheduledPromotions.length}</strong>
            <span>Scheduled Moves</span>
          </div>
        </div>
      </section>

      {/* Scheduled Future Promotions Panel */}
      {scheduledPromotions.length > 0 && (
        <section className="panel scheduled-promotions-panel" aria-labelledby="promotions-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Temporal Roster Moves</p>
              <h2 id="promotions-title">
                Scheduled Future Squad Promotions ({scheduledPromotions.length})
              </h2>
            </div>
          </div>
          <p className="muted">
            The following swimmers are scheduled to automatically transition to new squads on their effective dates.
          </p>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Swimmer</th>
                  <th>Current Squad</th>
                  <th>Target Squad</th>
                  <th>Effective Date</th>
                  <th>Notes</th>
                  {canManage && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {scheduledPromotions.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.swimmerName}</strong>
                    </td>
                    <td>{p.currentSquad}</td>
                    <td>
                      <span className="meta-tag squad-tag">{p.targetSquad}</span>
                    </td>
                    <td>
                      <span className="mono-time">{p.effectiveDate}</span>
                    </td>
                    <td>{p.notes || "—"}</td>
                    {canManage && (
                      <td>
                        <form action={cancelSquadPromotion}>
                          <input type="hidden" name="promotionId" value={p.id} />
                          <button
                            type="submit"
                            className="delete-link-btn"
                          >
                            Cancel Move
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Squad Cards Section */}
      <section className="panel" aria-labelledby="squads-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Club Structure</p>
            <h2 id="squads-title">Active Training Squads ({squads.length})</h2>
          </div>
          <div className="portal-links">
            <Link href="/swimmers">🏊 View Swimmer Roster ({allSwimmers.length})</Link>
            {canManage && <a href="#create-squad">+ Create Squad</a>}
          </div>
        </div>

        {squads.length === 0 ? (
          <div className="empty">
            No training squads have been created yet. Use the form below to create your first squad.
          </div>
        ) : (
          <div className="squad-cards-grid">
            {squads.map((squad) => {
              const isEditing = editSquadId === squad.id;
              const assignedSwimmers = allSwimmers.filter(
                (sw) => sw.squadId === squad.id || (!sw.squadId && sw.squad === squad.name),
              );
              const candidateSwimmers = allSwimmers.filter(
                (sw) => sw.squadId !== squad.id && sw.squad !== squad.name,
              );

              return (
                <article key={squad.id} className="squad-card">
                  <div>
                    <div className="squad-card-header">
                      <div>
                        <div className="squad-card-title">
                          <h3>{squad.name}</h3>
                          <span className="meta-tag squad-tag">
                            {assignedSwimmers.length} {assignedSwimmers.length === 1 ? "Swimmer" : "Swimmers"}
                          </span>
                        </div>

                        <div className="squad-coach-schedule">
                          {squad.coachName && (
                            <div>
                              <span className="muted">Lead Coach:</span>{" "}
                              <strong>{squad.coachName}</strong>
                            </div>
                          )}
                          {squad.schedule && (
                            <div>
                              <span className="muted">Schedule:</span>{" "}
                              <span>{squad.schedule}</span>
                            </div>
                          )}
                          {squad.description && (
                            <div className="muted" style={{ fontStyle: "italic", marginTop: "4px" }}>
                              &ldquo;{squad.description}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="squad-actions">
                        <Link
                          href={`/squads/${encodeURIComponent(squad.name)}/performance`}
                          className="button-secondary"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            textDecoration: "none",
                            fontSize: "11px",
                          }}
                        >
                          📈 Performance Radar
                        </Link>
                        {canManage && (
                          <Link
                            href={isEditing ? "/squads" : `/squads?editSquad=${squad.id}`}
                            className="button-secondary"
                            style={{ fontSize: "11px", textDecoration: "none" }}
                          >
                            {isEditing ? "Close" : "Edit"}
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Inline Squad Edit Box */}
                    {isEditing && canManage && (
                      <div className="squad-edit-box">
                        <h4>Edit Squad Details</h4>
                        <form action={updateSquad} className="form-grid" style={{ marginBottom: 0 }}>
                          <input type="hidden" name="squadId" value={squad.id} />
                          <label>
                            Squad Name *
                            <input name="name" defaultValue={squad.name} required />
                          </label>
                          <label>
                            Coach Name
                            <input name="coachName" defaultValue={squad.coachName || ""} />
                          </label>
                          <label>
                            Schedule
                            <input name="schedule" defaultValue={squad.schedule || ""} />
                          </label>
                          <label>
                            Description
                            <input name="description" defaultValue={squad.description || ""} />
                          </label>
                          <button type="submit">Save Changes</button>
                        </form>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(140, 160, 186, 0.12)" }}>
                          <form action={deleteSquad}>
                            <input type="hidden" name="squadId" value={squad.id} />
                            <button
                              type="submit"
                              className="delete-link-btn"
                            >
                              Delete Squad
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Squad Swimmers Roster Box */}
                  <div className="squad-roster-box">
                    <div className="squad-roster-title">
                      <span>Squad Roster ({assignedSwimmers.length})</span>
                    </div>

                    {assignedSwimmers.length === 0 ? (
                      <p className="muted" style={{ fontStyle: "italic", fontSize: "12px", margin: 0 }}>
                        No swimmers currently assigned to this squad.
                      </p>
                    ) : (
                      <div className="squad-member-list">
                        {assignedSwimmers.map((swimmer) => (
                          <div key={swimmer.id} className="squad-member-item">
                            <Link href={`/swimmers/${swimmer.id}`}>
                              {swimmer.firstName} {swimmer.lastName}
                            </Link>
                            <div>
                              {swimmer.governingBodyId && (
                                <small style={{ display: "inline", marginRight: "8px" }}>
                                  #{swimmer.governingBodyId}
                                </small>
                              )}
                              {canManage && (
                                <form action={removeSwimmerFromSquad} style={{ display: "inline" }}>
                                  <input type="hidden" name="swimmerId" value={swimmer.id} />
                                  <button
                                    type="submit"
                                    className="remove-btn"
                                    title="Remove from squad"
                                  >
                                    ✕
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Swimmer to this Squad */}
                    {canManage && candidateSwimmers.length > 0 && (
                      <form action={assignSwimmerToSquad} className="squad-assign-bar">
                        <input type="hidden" name="squadId" value={squad.id} />
                        <select
                          name="swimmerId"
                          required
                          aria-label={`Select swimmer to add to ${squad.name}`}
                        >
                          <option value="">+ Add swimmer to {squad.name}...</option>
                          {candidateSwimmers.map((sw) => (
                            <option key={sw.id} value={sw.id}>
                              {sw.firstName} {sw.lastName} ({sw.squadRel?.name || sw.squad || "Unassigned"})
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="button-secondary">
                          Add
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Unassigned Swimmers Section */}
      {unassignedSwimmers.length > 0 && (
        <section className="panel unassigned-panel" aria-labelledby="unassigned-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow" style={{ color: "var(--color-start-coral)" }}>
                Attention Needed
              </p>
              <h2 id="unassigned-title">
                Unassigned Swimmers ({unassignedSwimmers.length})
              </h2>
            </div>
          </div>
          <p className="muted">
            The following swimmers belong to {club.name} but are not yet assigned to an active training squad.
          </p>

          <div className="unassigned-grid">
            {unassignedSwimmers.map((swimmer) => (
              <div key={swimmer.id} className="unassigned-card">
                <div>
                  <Link href={`/swimmers/${swimmer.id}`}>
                    {swimmer.firstName} {swimmer.lastName}
                  </Link>
                  {swimmer.governingBodyId && (
                    <small>#{swimmer.governingBodyId}</small>
                  )}
                </div>

                {canManage && squads.length > 0 && (
                  <form action={assignSwimmerToSquad} className="inline-assign-form">
                    <input type="hidden" name="swimmerId" value={swimmer.id} />
                    <select
                      name="squadId"
                      required
                      aria-label={`Assign squad for ${swimmer.firstName} ${swimmer.lastName}`}
                    >
                      <option value="">Select squad...</option>
                      {squads.map((sq) => (
                        <option key={sq.id} value={sq.id}>
                          {sq.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit">✓</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Admin / Coach Action Panels matching form-grid */}
      {canManage && (
        <>
          {/* Create Squad Panel */}
          <section className="panel" id="create-squad" aria-labelledby="create-squad-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Squad Creation</p>
                <h2 id="create-squad-title">Create New Squad</h2>
              </div>
            </div>
            <p className="muted" style={{ marginBottom: "20px" }}>
              Define a training group with lead coach and weekly training schedule.
            </p>

            <form action={createSquad} className="form-grid">
              <label>
                Squad Name *
                <input name="name" required placeholder="e.g. Senior Performance" />
              </label>

              <label>
                Lead Coach Name
                <input name="coachName" placeholder="e.g. Head Coach Sarah" />
              </label>

              <label>
                Training Schedule
                <input name="schedule" placeholder="e.g. Mon/Wed/Fri 17:30 - 19:00" />
              </label>

              <label>
                Description / Criteria
                <input
                  name="description"
                  placeholder="e.g. Swimmers training for County championships"
                />
              </label>

              <button type="submit">Create Squad</button>
            </form>
          </section>

          {/* Schedule Future Promotion Panel */}
          <section className="panel" aria-labelledby="schedule-move-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Temporal Planning</p>
                <h2 id="schedule-move-title">Schedule Future Swimmer Move</h2>
              </div>
            </div>
            <p className="muted" style={{ marginBottom: "20px" }}>
              Plan ahead for squad reorganizations (e.g. new squads starting 1st May).
            </p>

            <form action={scheduleSquadPromotion} className="form-grid">
              <label>
                Swimmer *
                <select name="swimmerId" required aria-label="Select swimmer to schedule promotion">
                  <option value="">Select a swimmer...</option>
                  {allSwimmers.map((sw) => (
                    <option key={sw.id} value={sw.id}>
                      {sw.firstName} {sw.lastName} (Current: {sw.squadRel?.name || sw.squad || "Unassigned"})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Target Squad *
                <select name="targetSquad" required aria-label="Select target squad for promotion">
                  <option value="">Select destination...</option>
                  {squads.map((sq) => (
                    <option key={sq.id} value={sq.name}>
                      {sq.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Effective Date *
                <input name="effectiveDate" type="date" required />
              </label>

              <label>
                Transition Notes
                <input name="notes" placeholder="e.g. Promotion following County trial" />
              </label>

              <button type="submit">Schedule Promotion</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
