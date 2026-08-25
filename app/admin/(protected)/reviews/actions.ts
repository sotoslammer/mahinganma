import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { requireDb } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { identityReviews, programs, studentPrograms, students, waivers } from "@/lib/db/schema";
import { programByAutoTag } from "@/lib/programs";
import { ensurePrograms } from "@/lib/db/seed-programs";

async function enroll(studentId: string, autoTag: string | null | undefined) {
  const meta = programByAutoTag(autoTag);
  if (!meta) return;
  await ensurePrograms();
  const db = requireDb();
  const [program] = await db.select().from(programs).where(eq(programs.slug, meta.slug)).limit(1);
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
    status: meta.slug === "trial" ? "trial" : "active",
  });
}

export async function mergeReview(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!reviewId || !studentId) return;
  const db = requireDb();
  const [review] = await db.select().from(identityReviews).where(eq(identityReviews.id, reviewId)).limit(1);
  if (!review || review.status !== "pending") return;
  if (review.waiverId) {
    await db.update(waivers).set({ studentId, updatedAt: new Date() }).where(eq(waivers.id, review.waiverId));
  }
  const snapshot = review.snapshot as { autoTag?: string };
  await enroll(studentId, snapshot.autoTag);
  await db
    .update(identityReviews)
    .set({
      status: "merged",
      resolvedStudentId: studentId,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(identityReviews.id, reviewId));
  await writeAudit({ actorEmail: admin.email, action: "review.merge", entityType: "identity_review", entityId: reviewId, metadata: { studentId } });
  revalidatePath("/admin/reviews");
}

export async function createFromReview(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");
  if (!reviewId) return;
  const db = requireDb();
  const [review] = await db.select().from(identityReviews).where(eq(identityReviews.id, reviewId)).limit(1);
  if (!review || review.status !== "pending") return;
  const snapshot = review.snapshot as {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    dob?: string | null;
    isMinor?: boolean;
    autoTag?: string | null;
    guardianId?: string | null;
  };
  const [created] = await db
    .insert(students)
    .values({
      firstName: snapshot.firstName || "Unknown",
      lastName: snapshot.lastName || "Unknown",
      email: snapshot.email ?? null,
      phone: snapshot.phone ?? null,
      dob: snapshot.dob ?? null,
      isMinor: Boolean(snapshot.isMinor),
      status: snapshot.autoTag === "trial" ? "trial" : "active",
      guardianId: snapshot.guardianId ?? null,
    })
    .returning({ id: students.id });
  if (review.waiverId) {
    await db.update(waivers).set({ studentId: created.id, updatedAt: new Date() }).where(eq(waivers.id, review.waiverId));
  }
  await enroll(created.id, snapshot.autoTag);
  await db
    .update(identityReviews)
    .set({
      status: "created",
      resolvedStudentId: created.id,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(identityReviews.id, reviewId));
  await writeAudit({ actorEmail: admin.email, action: "review.create", entityType: "identity_review", entityId: reviewId, metadata: { studentId: created.id } });
  revalidatePath("/admin/reviews");
}

export async function ignoreReview(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");
  if (!reviewId) return;
  const db = requireDb();
  await db
    .update(identityReviews)
    .set({ status: "ignored", resolvedAt: new Date(), updatedAt: new Date() })
    .where(eq(identityReviews.id, reviewId));
  await writeAudit({ actorEmail: admin.email, action: "review.ignore", entityType: "identity_review", entityId: reviewId });
  revalidatePath("/admin/reviews");
}
