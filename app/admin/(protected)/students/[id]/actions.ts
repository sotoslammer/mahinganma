import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { requireDb } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { notes, stripeCustomers, students } from "@/lib/db/schema";
import { setConsent, sendEmail, sendSms } from "@/lib/messaging";
import { requireStripe } from "@/lib/stripe/client";
import { appUrl } from "@/lib/config";
import { stripePriceIdForSlug } from "@/lib/programs";

async function revalidateStudent(id: string) {
  revalidatePath(`/admin/students/${id}`);
  revalidatePath("/admin/students");
}

export async function addNote(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!studentId || !body) return;
  const db = requireDb();
  await db.insert(notes).values({ studentId, body, authorEmail: admin.email });
  await writeAudit({ actorEmail: admin.email, action: "note.create", entityType: "student", entityId: studentId });
  await revalidateStudent(studentId);
}

export async function updateStudentStatus(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!studentId || !status) return;
  const db = requireDb();
  await db.update(students).set({ status, updatedAt: new Date() }).where(eq(students.id, studentId));
  await writeAudit({ actorEmail: admin.email, action: "student.status", entityType: "student", entityId: studentId, metadata: { status } });
  await revalidateStudent(studentId);
}

export async function toggleConsent(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const channel = String(formData.get("channel") ?? "") as "email" | "sms";
  const granted = String(formData.get("granted") ?? "") === "true";
  if (!studentId || (channel !== "email" && channel !== "sms")) return;
  await setConsent({ studentId, channel, granted: !granted, source: "admin", evidence: admin.email });
  await writeAudit({ actorEmail: admin.email, action: "consent.update", entityType: "student", entityId: studentId, metadata: { channel, granted: !granted } });
  await revalidateStudent(studentId);
}

export async function sendStudentMessage(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const channel = String(formData.get("channel") ?? "");
  const kind = String(formData.get("kind") ?? "transactional") as "marketing" | "transactional" | "one_off";
  const subject = String(formData.get("subject") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const to = String(formData.get("to") ?? "");
  if (!studentId || !body || !to) return { error: "Missing message fields." };
  try {
    if (channel === "sms") {
      await sendSms({ studentId, to, body, kind, sentByEmail: admin.email });
    } else {
      await sendEmail({ studentId, to, subject: subject || "Message from Mahingan Martial Arts", body, kind, sentByEmail: admin.email });
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Send failed." };
  }
  await revalidateStudent(studentId);
  return { ok: true };
}

export async function createCheckoutLink(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const programSlug = String(formData.get("programSlug") ?? "");
  const email = String(formData.get("email") ?? "");
  const priceId = stripePriceIdForSlug(programSlug);
  if (!studentId || !priceId) return { error: "Set a Stripe price ID for this program first." };
  const stripe = requireStripe();
  const db = requireDb();
  const [customer] = await db.select().from(stripeCustomers).where(eq(stripeCustomers.studentId, studentId)).limit(1);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer?.stripeCustomerId,
    customer_email: customer?.stripeCustomerId ? undefined : email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/admin/students/${studentId}?checkout=success`,
    cancel_url: `${appUrl()}/admin/students/${studentId}?checkout=cancel`,
    metadata: { studentId, programSlug },
  });
  await writeAudit({ actorEmail: admin.email, action: "stripe.checkout", entityType: "student", entityId: studentId, metadata: { programSlug } });
  return { url: session.url };
}

export async function createPortalLink(formData: FormData) {
  "use server";
  await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const db = requireDb();
  const [customer] = await db.select().from(stripeCustomers).where(eq(stripeCustomers.studentId, studentId)).limit(1);
  if (!customer) return { error: "No Stripe customer is linked to this student." };
  const stripe = requireStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${appUrl()}/admin/students/${studentId}`,
  });
  return { url: session.url };
}

export async function linkStripeCustomer(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const studentId = String(formData.get("studentId") ?? "");
  const stripeCustomerId = String(formData.get("stripeCustomerId") ?? "").trim();
  if (!studentId || !stripeCustomerId) return;
  const db = requireDb();
  const existing = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.stripeCustomerId, stripeCustomerId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(stripeCustomers)
      .set({ studentId, updatedAt: new Date() })
      .where(eq(stripeCustomers.id, existing[0].id));
  } else {
    await db.insert(stripeCustomers).values({ stripeCustomerId, studentId });
  }
  await writeAudit({ actorEmail: admin.email, action: "stripe.link", entityType: "student", entityId: studentId, metadata: { stripeCustomerId } });
  await revalidateStudent(studentId);
}
