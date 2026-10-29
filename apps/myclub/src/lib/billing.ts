import Stripe from "stripe";
import { prisma } from "./prisma";
import { parseFreeClubLimit } from "./plan-policy";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  stripe ??= new Stripe(secretKey);
  return stripe;
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export function hasRecoverableSubscription(
  status: string | null | undefined,
  subscriptionId: string | null | undefined,
): boolean {
  return Boolean(
    subscriptionId &&
    status &&
    status !== "canceled" &&
    status !== "incomplete_expired",
  );
}

export async function syncClubSubscriptionQuantity(
  subscriptionId: string,
  quantity: number,
  idempotencyKey: string,
): Promise<void> {
  const priceId = process.env.STRIPE_CLUBS_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_CLUBS_PRICE_ID is not configured");
  const stripeClient = getStripe();
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
  const item = subscription.items.data.find(({ price }) => price.id === priceId);
  if (!item) throw new Error("The Stripe subscription does not include the club price");
  await stripeClient.subscriptions.update(
    subscriptionId,
    {
      items: [{ id: item.id, quantity: Math.max(1, quantity) }],
      proration_behavior: "always_invoice",
    },
    { idempotencyKey },
  );
}

export async function getFreeClubLimit(): Promise<number> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "free_club_limit" },
    select: { value: true },
  });
  return parseFreeClubLimit(setting?.value);
}
