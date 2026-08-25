import twilio from "twilio";
import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import { requireDb } from "@/lib/db";
import { consents, messages, students } from "@/lib/db/schema";
import { isResendConfigured, isTwilioConfigured } from "@/lib/config";
import { site } from "@/lib/site";
import { isQuietHours } from "@/lib/format";

function getResend(): Resend | null {
  if (!isResendConfigured()) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function getTwilio() {
  if (!isTwilioConfigured()) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
}

export async function hasConsent(studentId: string, channel: "email" | "sms"): Promise<boolean> {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(consents)
    .where(and(eq(consents.studentId, studentId), eq(consents.channel, channel), eq(consents.granted, true)))
    .limit(1);
  return Boolean(row);
}

export async function setConsent(input: {
  studentId: string;
  channel: "email" | "sms";
  granted: boolean;
  source: string;
  evidence?: string;
}) {
  const db = requireDb();
  const now = new Date();
  const existing = await db
    .select()
    .from(consents)
    .where(and(eq(consents.studentId, input.studentId), eq(consents.channel, input.channel)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(consents)
      .set({
        granted: input.granted,
        source: input.source,
        evidence: input.evidence ?? existing[0].evidence,
        grantedAt: input.granted ? now : existing[0].grantedAt,
        revokedAt: input.granted ? null : now,
        updatedAt: now,
      })
      .where(eq(consents.id, existing[0].id));
    return;
  }
  await db.insert(consents).values({
    studentId: input.studentId,
    channel: input.channel,
    granted: input.granted,
    source: input.source,
    evidence: input.evidence,
    grantedAt: input.granted ? now : null,
    revokedAt: input.granted ? null : now,
  });
}

function emailFooter(): string {
  return `\n\n— ${site.name}\n${site.contact.addressLines.join(", ")}\n${site.contact.phone}\nTo unsubscribe, reply to this email or ask us to remove you.`;
}

function smsBody(message: string): string {
  const prefix = `${site.name}: `;
  const suffix = " Reply STOP to opt out.";
  const combined = `${prefix}${message}${suffix}`;
  return combined.length > 320 ? `${combined.slice(0, 317)}...` : combined;
}

export async function sendEmail(input: {
  studentId?: string | null;
  to: string;
  subject: string;
  body: string;
  kind: "marketing" | "transactional" | "one_off";
  sentByEmail?: string;
}): Promise<{ id: string; status: string }> {
  const db = requireDb();
  const resend = getResend();
  if (!resend || !process.env.RESEND_FROM) {
    throw new Error("Email is not configured.");
  }
  if (input.kind === "marketing" && input.studentId) {
    const ok = await hasConsent(input.studentId, "email");
    if (!ok) throw new Error("No email marketing consent for this student.");
  }
  const text = `${input.body}${emailFooter()}`;
  const html = `<p>${input.body.replace(/\n/g, "<br/>")}</p><p style="color:#888;font-size:12px">${site.name}<br/>${site.contact.addressLines.join("<br/>")}<br/>${site.contact.phone}</p><p style="font-size:12px"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a></p>`;
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to: input.to,
    subject: input.subject,
    text,
    html: input.kind === "marketing" ? html : `<p>${input.body.replace(/\n/g, "<br/>")}</p><p style="color:#888;font-size:12px">${site.name}<br/>${site.contact.addressLines.join("<br/>")}</p>`,
  });
  const status = error ? "failed" : "sent";
  const [row] = await db
    .insert(messages)
    .values({
      channel: "email",
      kind: input.kind,
      studentId: input.studentId ?? null,
      toAddress: input.to,
      subject: input.subject,
      body: text,
      status,
      provider: "resend",
      providerId: data?.id ?? null,
      error: error ? String(error.message ?? error) : null,
      sentByEmail: input.sentByEmail ?? null,
    })
    .returning({ id: messages.id });
  if (error) throw new Error(error.message);
  return { id: row.id, status };
}

export async function sendSms(input: {
  studentId?: string | null;
  to: string;
  body: string;
  kind: "marketing" | "transactional" | "one_off";
  sentByEmail?: string;
}): Promise<{ id: string; status: string }> {
  const db = requireDb();
  const client = getTwilio();
  if (!client) throw new Error("SMS is not configured.");
  if (input.kind === "marketing") {
    if (isQuietHours()) throw new Error("Marketing SMS is blocked during quiet hours (9pm–9am Saskatchewan).");
    if (input.studentId) {
      const ok = await hasConsent(input.studentId, "sms");
      if (!ok) throw new Error("No SMS marketing consent for this student.");
    }
  }
  const body = smsBody(input.body);
  try {
    const created = await client.messages.create({
      from: process.env.TWILIO_FROM_NUMBER!,
      to: input.to,
      body,
    });
    const [row] = await db
      .insert(messages)
      .values({
        channel: "sms",
        kind: input.kind,
        studentId: input.studentId ?? null,
        toAddress: input.to,
        body,
        status: "sent",
        provider: "twilio",
        providerId: created.sid,
        sentByEmail: input.sentByEmail ?? null,
      })
      .returning({ id: messages.id });
    return { id: row.id, status: "sent" };
  } catch (error) {
    await db.insert(messages).values({
      channel: "sms",
      kind: input.kind,
      studentId: input.studentId ?? null,
      toAddress: input.to,
      body,
      status: "failed",
      provider: "twilio",
      error: error instanceof Error ? error.message : String(error),
      sentByEmail: input.sentByEmail ?? null,
    });
    throw error;
  }
}

export async function syncResendContact(student: {
  email: string | null;
  firstName: string;
  lastName: string;
  unsubscribed: boolean;
}) {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const resend = getResend();
  if (!resend || !audienceId || !student.email) return;
  await resend.contacts.create({
    audienceId,
    email: student.email,
    firstName: student.firstName,
    lastName: student.lastName,
    unsubscribed: student.unsubscribed,
  });
}

export async function sendBroadcast(input: {
  subject: string;
  html: string;
  sentByEmail?: string;
}): Promise<{ id: string }> {
  const resend = getResend();
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!resend || !process.env.RESEND_FROM || !segmentId) {
    throw new Error("Resend broadcasts are not configured (need RESEND_FROM and RESEND_SEGMENT_ID).");
  }
  const html = input.html.includes("RESEND_UNSUBSCRIBE_URL")
    ? input.html
    : `${input.html}<p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a></p>`;
  const { data, error } = await resend.broadcasts.create({
    segmentId,
    from: process.env.RESEND_FROM,
    subject: input.subject,
    html,
    send: true,
  });
  if (error) throw new Error(error.message);
  const db = requireDb();
  const [row] = await db
    .insert(messages)
    .values({
      channel: "email",
      kind: "marketing",
      toAddress: "segment",
      subject: input.subject,
      body: html,
      status: "sent",
      provider: "resend",
      providerId: data?.id ?? null,
      sentByEmail: input.sentByEmail ?? null,
    })
    .returning({ id: messages.id });
  return { id: row.id };
}

export async function findStudentByPhone(phone: string) {
  const db = requireDb();
  const digits = phone.replace(/[^\d]/g, "");
  const rows = await db.select().from(students);
  return rows.find((row) => (row.phone ?? "").replace(/[^\d]/g, "").endsWith(digits.slice(-10))) ?? null;
}
