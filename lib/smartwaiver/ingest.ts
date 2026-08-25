import { and, eq, ilike, or } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { ensurePrograms } from "@/lib/db/seed-programs";
import { claimWebhookEvent } from "@/lib/db/webhooks";
import {
  consents,
  guardians,
  identityReviews,
  programs,
  studentPrograms,
  students,
  syncState,
  waivers,
} from "@/lib/db/schema";
import { normalizeEmail, normalizePhone } from "@/lib/crypto";
import { programByAutoTag } from "@/lib/programs";
import { extractConsents } from "@/lib/smartwaiver/consent";
import {
  getAccountQueueMessage,
  deleteAccountQueueMessage,
  getWaiver,
  listWaivers,
  type SmartwaiverParticipant,
  type SmartwaiverWaiver,
} from "@/lib/smartwaiver/client";
import { decideMatch } from "@/lib/smartwaiver/match";

function parseDate(value: string | null | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function waiverIdOf(waiver: SmartwaiverWaiver, fallback?: string): string {
  return waiver.waiverId || waiver.unique_id || fallback || "";
}

function participantsOf(waiver: SmartwaiverWaiver): SmartwaiverParticipant[] {
  if (Array.isArray(waiver.participants) && waiver.participants.length > 0) {
    return waiver.participants;
  }
  return [
    {
      firstName: waiver.firstName,
      lastName: waiver.lastName,
      dob: waiver.dob,
      phone: waiver.phone,
      isMinor: false,
    },
  ];
}

async function findCandidates(input: {
  email: string | null;
  firstName: string;
  lastName: string;
  dob: string | null;
}) {
  const db = requireDb();
  const clauses = [];
  if (input.email) clauses.push(ilike(students.email, input.email));
  if (input.firstName && input.lastName && input.dob) {
    clauses.push(
      and(
        ilike(students.firstName, input.firstName),
        ilike(students.lastName, input.lastName),
        eq(students.dob, input.dob),
      ),
    );
  }
  if (clauses.length === 0) return [];
  return db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      email: students.email,
      dob: students.dob,
    })
    .from(students)
    .where(or(...clauses));
}

async function upsertGuardian(waiver: SmartwaiverWaiver): Promise<string | null> {
  const guardian = waiver.guardian;
  if (!guardian?.firstName || !guardian.lastName) return null;
  const db = requireDb();
  const email = normalizeEmail(waiver.email);
  const phone = normalizePhone(guardian.phone);
  if (email) {
    const existing = await db.select().from(guardians).where(eq(guardians.email, email)).limit(1);
    if (existing[0]) {
      await db
        .update(guardians)
        .set({
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          phone: phone ?? existing[0].phone,
          dob: guardian.dob ?? existing[0].dob,
          relationship: guardian.relationship ?? existing[0].relationship,
          updatedAt: new Date(),
        })
        .where(eq(guardians.id, existing[0].id));
      return existing[0].id;
    }
  }
  const [created] = await db
    .insert(guardians)
    .values({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email,
      phone,
      dob: guardian.dob ?? null,
      relationship: guardian.relationship ?? null,
    })
    .returning({ id: guardians.id });
  return created?.id ?? null;
}

async function enroll(studentId: string, autoTag: string | null | undefined, isTrial: boolean) {
  const programMeta = programByAutoTag(autoTag);
  if (!programMeta) return;
  const db = requireDb();
  const [program] = await db.select().from(programs).where(eq(programs.slug, programMeta.slug)).limit(1);
  if (!program) return;
  const existing = await db
    .select({ id: studentPrograms.id })
    .from(studentPrograms)
    .where(and(eq(studentPrograms.studentId, studentId), eq(studentPrograms.programId, program.id)))
    .limit(1);
  if (existing[0]) return;
  await db.insert(studentPrograms).values({
    studentId,
    programId: program.id,
    status: isTrial ? "trial" : "active",
  });
}

async function upsertConsent(studentId: string, channel: "email" | "sms", granted: boolean, evidence: string) {
  const db = requireDb();
  const existing = await db
    .select()
    .from(consents)
    .where(and(eq(consents.studentId, studentId), eq(consents.channel, channel)))
    .limit(1);
  const now = new Date();
  if (!existing[0]) {
    await db.insert(consents).values({
      studentId,
      channel,
      granted,
      source: "waiver",
      evidence,
      grantedAt: granted ? now : null,
      revokedAt: granted ? null : now,
    });
    return;
  }
  if (existing[0].granted === granted) return;
  await db
    .update(consents)
    .set({
      granted,
      source: "waiver",
      evidence,
      grantedAt: granted ? now : existing[0].grantedAt,
      revokedAt: granted ? null : now,
      updatedAt: now,
    })
    .where(eq(consents.id, existing[0].id));
}

export async function ingestWaiver(waiverId: string, source = "webhook"): Promise<{ ok: true } | { skipped: true }> {
  const claimed = await claimWebhookEvent({
    provider: "smartwaiver",
    eventId: `waiver:${waiverId}`,
    eventType: source,
    payload: { waiverId },
  });
  if (!claimed) return { skipped: true };

  await ensurePrograms();
  const waiver = await getWaiver(waiverId);
  const id = waiverIdOf(waiver, waiverId);
  if (!id) throw new Error("Waiver is missing an id.");

  const db = requireDb();
  const people = participantsOf(waiver);
  const guardianId = people.some((person) => person.isMinor) ? await upsertGuardian(waiver) : null;
  const consentsFromWaiver = extractConsents(waiver);
  const autoTag = waiver.autoTag?.trim() || null;
  const isTrial = programByAutoTag(autoTag)?.slug === "trial";

  for (const [index, person] of people.entries()) {
    const firstName = (person.firstName ?? waiver.firstName ?? "").trim() || "Unknown";
    const lastName = (person.lastName ?? waiver.lastName ?? "").trim() || "Unknown";
    const email = person.isMinor ? null : normalizeEmail(waiver.email);
    const phone = normalizePhone(person.phone ?? (person.isMinor ? waiver.guardian?.phone : waiver.phone));
    const dob = (person.dob ?? waiver.dob ?? "").trim() || null;
    const isMinor = Boolean(person.isMinor);
    const snapshot = {
      firstName,
      lastName,
      email,
      phone,
      dob,
      isMinor,
      autoTag,
      guardianId,
    };

    const existingWaiver = await db
      .select()
      .from(waivers)
      .where(and(eq(waivers.smartwaiverId, id), eq(waivers.participantIndex, index)))
      .limit(1);

    let studentId = existingWaiver[0]?.studentId ?? null;

    if (!studentId) {
      const candidates = await findCandidates({ email, firstName, lastName, dob });
      const decision = decideMatch({ firstName, lastName, email, dob }, candidates);

      if (decision.type === "existing") {
        studentId = decision.studentId;
      } else if (decision.type === "create") {
        const [created] = await db
          .insert(students)
          .values({
            firstName,
            lastName,
            email,
            phone,
            dob,
            isMinor,
            status: isTrial ? "trial" : "active",
            guardianId: isMinor ? guardianId : null,
          })
          .returning({ id: students.id });
        studentId = created.id;
      } else {
        const [waiverRow] = existingWaiver[0]
          ? existingWaiver
          : await db
              .insert(waivers)
              .values({
                smartwaiverId: id,
                participantIndex: index,
                studentId: null,
                templateId: waiver.templateId ?? null,
                title: waiver.title ?? null,
                autoTag,
                signedAt: parseDate(waiver.createdOn),
                expiresAt: parseDate(waiver.expirationDate),
                expired: Boolean(waiver.expired),
                verified: Boolean(waiver.verified),
                raw: waiver as unknown as Record<string, unknown>,
              })
              .returning({ id: waivers.id });

        await db.insert(identityReviews).values({
          waiverId: waiverRow.id,
          smartwaiverId: id,
          participantIndex: index,
          status: "pending",
          reason: decision.reason,
          snapshot,
          candidateStudentIds: decision.candidateIds,
        });
        continue;
      }
    }

    if (studentId) {
      await db
        .update(students)
        .set({
          email: email ?? undefined,
          phone: phone ?? undefined,
          dob: dob ?? undefined,
          isMinor,
          guardianId: isMinor ? guardianId : undefined,
          status: isTrial ? "trial" : "active",
          updatedAt: new Date(),
        })
        .where(eq(students.id, studentId));
      await enroll(studentId, autoTag, isTrial);
      await upsertConsent(studentId, "email", consentsFromWaiver.email, `waiver:${id}`);
      await upsertConsent(studentId, "sms", consentsFromWaiver.sms, `waiver:${id}`);
    }

    if (existingWaiver[0]) {
      await db
        .update(waivers)
        .set({
          studentId,
          templateId: waiver.templateId ?? existingWaiver[0].templateId,
          title: waiver.title ?? existingWaiver[0].title,
          autoTag,
          signedAt: parseDate(waiver.createdOn) ?? existingWaiver[0].signedAt,
          expiresAt: parseDate(waiver.expirationDate),
          expired: Boolean(waiver.expired),
          verified: Boolean(waiver.verified),
          raw: waiver as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(waivers.id, existingWaiver[0].id));
    } else {
      await db.insert(waivers).values({
        smartwaiverId: id,
        participantIndex: index,
        studentId,
        templateId: waiver.templateId ?? null,
        title: waiver.title ?? null,
        autoTag,
        signedAt: parseDate(waiver.createdOn),
        expiresAt: parseDate(waiver.expirationDate),
        expired: Boolean(waiver.expired),
        verified: Boolean(waiver.verified),
        raw: waiver as unknown as Record<string, unknown>,
      });
    }
  }

  await writeAudit({
    action: "smartwaiver.ingest",
    entityType: "waiver",
    entityId: id,
    metadata: { source, participants: people.length },
  });

  return { ok: true };
}

export async function drainSmartwaiverQueue(max = 40): Promise<{ processed: number; skipped: number }> {
  let processed = 0;
  let skipped = 0;
  for (let i = 0; i < max; i += 1) {
    const message = await getAccountQueueMessage();
    if (!message?.messageId) break;
    const waiverId = message.payload?.unique_id;
    if (waiverId) {
      const result = await ingestWaiver(waiverId, "queue");
      if ("skipped" in result) skipped += 1;
      else processed += 1;
    }
    await deleteAccountQueueMessage(message.messageId);
  }
  return { processed, skipped };
}

export async function backfillSmartwaiver(limit = 100): Promise<{ processed: number; skipped: number }> {
  const db = requireDb();
  const [state] = await db.select().from(syncState).where(eq(syncState.provider, "smartwaiver")).limit(1);
  const fromDts = state?.cursor ?? undefined;
  const listed = await listWaivers({ limit, fromDts });
  let processed = 0;
  let skipped = 0;
  let newest: string | undefined;
  for (const row of listed) {
    const id = row.waiverId || row.unique_id;
    if (!id) continue;
    const result = await ingestWaiver(id, "backfill");
    if ("skipped" in result) skipped += 1;
    else processed += 1;
    newest = id;
  }
  await db
    .insert(syncState)
    .values({
      provider: "smartwaiver",
      cursor: newest ?? fromDts ?? null,
      lastSyncedAt: new Date(),
      metadata: { listed: listed.length, processed, skipped },
    })
    .onConflictDoUpdate({
      target: syncState.provider,
      set: {
        cursor: newest ?? fromDts ?? null,
        lastSyncedAt: new Date(),
        metadata: { listed: listed.length, processed, skipped },
        updatedAt: new Date(),
      },
    });
  return { processed, skipped };
}
