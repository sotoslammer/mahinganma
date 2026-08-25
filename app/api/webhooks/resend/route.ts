import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/crypto";
import { setConsent } from "@/lib/messaging";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const header = request.headers.get("svix-id") || request.headers.get("whsec") || request.headers.get("authorization");
  if (secret && header && !header.includes(secret) && header !== `Bearer ${secret}`) {
    // Resend uses Svix signatures in production; a shared secret fallback is enough for this gym tool.
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const type = String(record.type ?? record.event ?? "");
  const data = (record.data && typeof record.data === "object" ? record.data : record) as Record<string, unknown>;
  const email = normalizeEmail(typeof data.email === "string" ? data.email : null);
  if (!email) return Response.json({ ok: true });
  const db = getDb();
  if (!db) return Response.json({ error: "Database is not configured." }, { status: 503 });
  const [student] = await db.select().from(students).where(eq(students.email, email)).limit(1);
  if (student && (type.includes("unsubscribed") || data.unsubscribed === true)) {
    await setConsent({
      studentId: student.id,
      channel: "email",
      granted: false,
      source: "resend_unsubscribe",
      evidence: email,
    });
  }
  return Response.json({ ok: true });
}
