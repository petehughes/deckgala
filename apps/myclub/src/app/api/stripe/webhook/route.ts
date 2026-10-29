import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/billing";
import { prisma } from "../../../../lib/prisma";

async function saveSubscription(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) throw new Error("Stripe subscription is missing its DeckGala user ID");
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  await prisma.billingAccount.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    },
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = Buffer.from(await request.arrayBuffer());
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Invalid Stripe webhook signature", error);
    return NextResponse.json({ error: "Invalid Stripe webhook signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object;
      if (checkout.mode === "subscription" && checkout.subscription) {
        const subscriptionId = typeof checkout.subscription === "string"
          ? checkout.subscription
          : checkout.subscription.id;
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await saveSubscription(subscription);
      }
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await saveSubscription(event.data.object);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to process Stripe webhook", error);
    return NextResponse.json({ error: "Failed to process Stripe webhook" }, { status: 500 });
  }
}
