import { createStripeCheckoutSession, openStripeBillingPortal } from "../actions";
import {
  getFreeClubLimit,
  hasRecoverableSubscription,
  isSubscriptionActive,
} from "../../lib/billing";
import { prisma } from "../../lib/prisma";
import { requireSession } from "../../lib/session";

export default async function BillingPage() {
  const session = await requireSession();
  const [adminClubCount, freeClubLimit, billing] = await Promise.all([
    prisma.clubMembership.count({ where: { userId: session.user.id, role: "ADMIN" } }),
    getFreeClubLimit(),
    prisma.billingAccount.findUnique({
      where: { userId: session.user.id },
      select: { subscriptionStatus: true, stripeSubscriptionId: true },
    }),
  ]);
  const active = isSubscriptionActive(billing?.subscriptionStatus);
  const hasExistingSubscription = hasRecoverableSubscription(
    billing?.subscriptionStatus,
    billing?.stripeSubscriptionId,
  );
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CLUBS_PRICE_ID);

  return (
    <section className="panel billing-panel">
      <a className="back-link" href="/">← Back to clubs</a>
      <p className="eyebrow">AquaTeamHub subscription</p>
      <h1>One account. More clubs.</h1>
      <p className="muted">
        {adminClubCount} club{adminClubCount === 1 ? "" : "s"} managed · {freeClubLimit} free club{freeClubLimit === 1 ? "" : "s"} included
      </p>
      {active || hasExistingSubscription ? (
        <>
          <p className={`status${active ? "" : " status-due-soon"}`}>Subscription {billing?.subscriptionStatus}</p>
          <p className="muted">Your subscription covers the clubs above your free allowance. Additional clubs are billed as recurring club quantities.</p>
          <form action={openStripeBillingPortal}><button type="submit">{active ? "Manage subscription" : "Resolve or manage subscription"}</button></form>
        </>
      ) : (
        <>
          <p className="muted">
            {adminClubCount >= freeClubLimit
              ? "You have reached the free-club allowance. Subscribe to create additional clubs; the Stripe quantity will match the clubs above your allowance."
              : "You can create clubs up to the free allowance. Subscribe any time to enable additional clubs."}
          </p>
          {stripeReady ? (
            <form action={createStripeCheckoutSession}><button type="submit">Subscribe with Stripe</button></form>
          ) : (
            <p className="notice-error">Billing is not configured yet. Contact the AquaTeamHub platform administrator.</p>
          )}
        </>
      )}
      {!process.env.STRIPE_WEBHOOK_SECRET && (
        <p className="muted">Subscriptions become active after the Stripe webhook is configured.</p>
      )}
    </section>
  );
}
