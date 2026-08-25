import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  consents,
  identityReviews,
  messages,
  notes,
  programs,
  stripeCustomers,
  stripePayments,
  stripeSubscriptions,
  studentPrograms,
  students,
  waivers,
} from "@/lib/db/schema";

export type StudentFilters = {
  q?: string;
  program?: string;
  status?: string;
  waiver?: "valid" | "expired" | "missing" | "expiring";
};

export async function listStudents(filters: StudentFilters) {
  const db = getDb();
  if (!db) return [];
  const clauses = [];
  if (filters.q) {
    const term = `%${filters.q}%`;
    clauses.push(
      or(
        ilike(students.firstName, term),
        ilike(students.lastName, term),
        ilike(students.email, term),
        ilike(students.phone, term),
      ),
    );
  }
  if (filters.status) clauses.push(eq(students.status, filters.status));

  const rows = await db
    .select()
    .from(students)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(students.lastName, students.firstName);

  const [allPrograms, allEnrollments, allWaivers, allSubs, allCustomers] = await Promise.all([
    db.select().from(programs),
    db.select().from(studentPrograms),
    db.select().from(waivers),
    db.select().from(stripeSubscriptions),
    db.select().from(stripeCustomers),
  ]);

  const programById = new Map(allPrograms.map((row) => [row.id, row]));
  const enrollmentsByStudent = new Map<string, string[]>();
  for (const row of allEnrollments) {
    const slug = programById.get(row.programId)?.slug;
    if (!slug) continue;
    const list = enrollmentsByStudent.get(row.studentId) ?? [];
    list.push(slug);
    enrollmentsByStudent.set(row.studentId, list);
  }

  const latestWaiver = new Map<string, (typeof allWaivers)[number]>();
  for (const row of allWaivers) {
    if (!row.studentId) continue;
    const current = latestWaiver.get(row.studentId);
    if (!current || (row.signedAt && current.signedAt && row.signedAt > current.signedAt) || !current.signedAt) {
      latestWaiver.set(row.studentId, row);
    }
  }

  const customerByStudent = new Map(allCustomers.filter((row) => row.studentId).map((row) => [row.studentId!, row]));
  const subByCustomer = new Map<string, (typeof allSubs)[number]>();
  for (const sub of allSubs) {
    const current = subByCustomer.get(sub.stripeCustomerId);
    if (!current || (sub.updatedAt && current.updatedAt && sub.updatedAt > current.updatedAt)) {
      subByCustomer.set(sub.stripeCustomerId, sub);
    }
  }

  const now = Date.now();
  const soon = now + 30 * 24 * 60 * 60 * 1000;

  return rows
    .map((student) => {
      const programSlugs = enrollmentsByStudent.get(student.id) ?? [];
      const waiver = latestWaiver.get(student.id) ?? null;
      const customer = customerByStudent.get(student.id) ?? null;
      const subscription = customer ? subByCustomer.get(customer.stripeCustomerId) ?? null : null;
      return { student, programSlugs, waiver, subscription };
    })
    .filter((row) => {
      if (filters.program && !row.programSlugs.includes(filters.program)) return false;
      if (filters.waiver === "missing") return !row.waiver;
      if (filters.waiver === "expired") return Boolean(row.waiver?.expired || (row.waiver?.expiresAt && row.waiver.expiresAt.getTime() < now));
      if (filters.waiver === "expiring") {
        const expires = row.waiver?.expiresAt?.getTime();
        return Boolean(expires && expires >= now && expires <= soon);
      }
      if (filters.waiver === "valid") {
        const expires = row.waiver?.expiresAt?.getTime();
        return Boolean(row.waiver && !row.waiver.expired && (!expires || expires >= now));
      }
      return true;
    });
}

export async function getStudentDetail(id: string) {
  const db = getDb();
  if (!db) return null;
  const [student] = await db.select().from(students).where(eq(students.id, id)).limit(1);
  if (!student) return null;
  const [studentWaivers, enrollments, allPrograms, studentConsents, studentNotes, customer, studentMessages] =
    await Promise.all([
      db.select().from(waivers).where(eq(waivers.studentId, id)).orderBy(desc(waivers.signedAt)),
      db.select().from(studentPrograms).where(eq(studentPrograms.studentId, id)),
      db.select().from(programs),
      db.select().from(consents).where(eq(consents.studentId, id)),
      db.select().from(notes).where(eq(notes.studentId, id)).orderBy(desc(notes.createdAt)),
      db.select().from(stripeCustomers).where(eq(stripeCustomers.studentId, id)).limit(1).then((rows) => rows[0] ?? null),
      db.select().from(messages).where(eq(messages.studentId, id)).orderBy(desc(messages.createdAt)).limit(20),
    ]);
  const programName = new Map(allPrograms.map((row) => [row.id, row]));
  const subscriptions = customer
    ? await db
        .select()
        .from(stripeSubscriptions)
        .where(eq(stripeSubscriptions.stripeCustomerId, customer.stripeCustomerId))
        .orderBy(desc(stripeSubscriptions.updatedAt))
    : [];
  const payments = customer
    ? await db
        .select()
        .from(stripePayments)
        .where(eq(stripePayments.stripeCustomerId, customer.stripeCustomerId))
        .orderBy(desc(stripePayments.createdAt))
        .limit(20)
    : [];
  return {
    student,
    waivers: studentWaivers,
    enrollments: enrollments.map((row) => ({ ...row, program: programName.get(row.programId) ?? null })),
    consents: studentConsents,
    notes: studentNotes,
    customer,
    subscriptions,
    payments,
    messages: studentMessages,
    programs: allPrograms,
  };
}

export async function dashboardStats() {
  const db = getDb();
  if (!db) return null;
  const [studentRows] = await db.select({ count: sql<number>`count(*)` }).from(students);
  const [pendingReviews] = await db
    .select({ count: sql<number>`count(*)` })
    .from(identityReviews)
    .where(eq(identityReviews.status, "pending"));
  const [activeSubs] = await db
    .select({ count: sql<number>`count(*)` })
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.status, "active"));
  const [pastDue] = await db
    .select({ count: sql<number>`count(*)` })
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.status, "past_due"));
  return {
    students: Number(studentRows?.count ?? 0),
    reviews: Number(pendingReviews?.count ?? 0),
    activeSubscriptions: Number(activeSubs?.count ?? 0),
    pastDue: Number(pastDue?.count ?? 0),
  };
}

export async function listPendingReviews() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(identityReviews).where(eq(identityReviews.status, "pending")).orderBy(desc(identityReviews.createdAt));
}

export async function listPayments() {
  const db = getDb();
  if (!db) return { subscriptions: [], payments: [], customers: [] };
  const [subscriptions, payments, customers] = await Promise.all([
    db.select().from(stripeSubscriptions).orderBy(desc(stripeSubscriptions.updatedAt)),
    db.select().from(stripePayments).orderBy(desc(stripePayments.createdAt)).limit(50),
    db.select().from(stripeCustomers),
  ]);
  return { subscriptions, payments, customers };
}

export async function listMessages() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(messages).orderBy(desc(messages.createdAt)).limit(50);
}
