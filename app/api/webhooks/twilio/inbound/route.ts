import { findStudentByPhone, setConsent } from "@/lib/messaging";
import { isDatabaseConfigured, isTwilioConfigured } from "@/lib/config";
import { site } from "@/lib/site";

export const runtime = "nodejs";

const STOP = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);
const START = new Set(["start", "yes", "unstop"]);

function twiml(message: string) {
  const escaped = message
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

export async function POST(request: Request) {
  if (!isTwilioConfigured() || !isDatabaseConfigured()) {
    return new Response("Not configured", { status: 503 });
  }
  const form = await request.formData();
  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "").trim().toLowerCase();
  if (!from) return new Response("Missing From", { status: 400 });

  const student = await findStudentByPhone(from);
  if (STOP.has(body)) {
    if (student) {
      await setConsent({
        studentId: student.id,
        channel: "sms",
        granted: false,
        source: "sms_stop",
        evidence: from,
      });
    }
    return new Response(twiml(`${site.name}: You are unsubscribed from texts. Reply START to opt in again.`), {
      headers: { "Content-Type": "text/xml" },
    });
  }
  if (body === "help") {
    return new Response(
      twiml(`${site.name} (${site.contact.phone}). Reply STOP to unsubscribe.`),
      { headers: { "Content-Type": "text/xml" } },
    );
  }
  if (START.has(body) && student) {
    await setConsent({
      studentId: student.id,
      channel: "sms",
      granted: true,
      source: "sms_start",
      evidence: from,
    });
    return new Response(twiml(`${site.name}: You are opted in to texts. Reply STOP to unsubscribe.`), {
      headers: { "Content-Type": "text/xml" },
    });
  }
  return new Response(twiml(`Thanks — a coach at ${site.name} will follow up if needed.`), {
    headers: { "Content-Type": "text/xml" },
  });
}
