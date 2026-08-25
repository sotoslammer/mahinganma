import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { webhookEvents } from "@/lib/db/schema";

export async function claimWebhookEvent(input: {
  provider: string;
  eventId: string;
  eventType?: string;
  payload?: Record<string, unknown>;
}): Promise<boolean> {
  const db = requireDb();
  const existing = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(and(eq(webhookEvents.provider, input.provider), eq(webhookEvents.eventId, input.eventId)))
    .limit(1);
  if (existing[0]) return false;
  await db.insert(webhookEvents).values({
    provider: input.provider,
    eventId: input.eventId,
    eventType: input.eventType,
    payload: input.payload,
  });
  return true;
}
