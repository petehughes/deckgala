import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { pushSubscriptionInputSchema } from "@aquateamhub/api-types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = pushSubscriptionInputSchema.parse(body);

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.endpoint },
      update: {
        userId: session.user.id,
        p256dh: parsed.p256dh,
        auth: parsed.auth,
        userAgent: parsed.userAgent,
      },
      create: {
        userId: session.user.id,
        endpoint: parsed.endpoint,
        p256dh: parsed.p256dh,
        auth: parsed.auth,
        userAgent: parsed.userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

