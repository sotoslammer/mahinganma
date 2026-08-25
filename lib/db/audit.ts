import { requireDb } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export async function writeAudit(input: {
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = requireDb();
  await db.insert(auditLog).values({
    actorEmail: input.actorEmail ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata,
  });
}
