"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { requireDb } from "@/lib/db";
import { consents } from "@/lib/db/schema";
import { sendBroadcast, sendEmail, sendSms } from "@/lib/messaging";
import { listStudents } from "@/lib/admin/queries";

export async function sendBulkMessage(formData: FormData) {
  const admin = await requireAdmin();
  const channel = String(formData.get("channel") ?? "email");
  const kind = String(formData.get("kind") ?? "marketing") as "marketing" | "transactional" | "one_off";
  const subject = String(formData.get("subject") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const program = String(formData.get("program") ?? "") || undefined;
  const status = String(formData.get("status") ?? "") || undefined;
  const useBroadcast = String(formData.get("broadcast") ?? "") === "on";
  if (!body) return { error: "Message body is required." };

  if (useBroadcast && channel === "email" && kind === "marketing") {
    try {
      await sendBroadcast({
        subject: subject || "Update from Mahingan Martial Arts",
        html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
        sentByEmail: admin.email,
      });
      revalidatePath("/admin/messages");
      return { ok: true, sent: "broadcast" };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Broadcast failed." };
    }
  }

  const rows = await listStudents({ program, status });
  const db = requireDb();
  let sent = 0;
  let skipped = 0;
  for (const { student } of rows) {
    if (kind === "marketing") {
      const [consent] = await db
        .select()
        .from(consents)
        .where(and(eq(consents.studentId, student.id), eq(consents.channel, channel), eq(consents.granted, true)))
        .limit(1);
      if (!consent) {
        skipped += 1;
        continue;
      }
    }
    try {
      if (channel === "sms") {
        if (!student.phone) {
          skipped += 1;
          continue;
        }
        await sendSms({
          studentId: student.id,
          to: student.phone,
          body,
          kind,
          sentByEmail: admin.email,
        });
      } else {
        if (!student.email) {
          skipped += 1;
          continue;
        }
        await sendEmail({
          studentId: student.id,
          to: student.email,
          subject: subject || "Message from Mahingan Martial Arts",
          body,
          kind,
          sentByEmail: admin.email,
        });
      }
      sent += 1;
    } catch {
      skipped += 1;
    }
  }
  revalidatePath("/admin/messages");
  return { ok: true, sent, skipped };
}
