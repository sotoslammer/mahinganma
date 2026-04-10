import { Resend } from "resend";
import { site } from "@/lib/site";

export const runtime = "nodejs";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const simpleEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

export async function POST(request: Request) {
  const from = process.env.RESEND_FROM;
  if (!resend || !process.env.RESEND_API_KEY || !from) {
    return Response.json({ error: "Email is not configured on the server." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, phone, message, website } = payload as Record<string, unknown>;

  if (typeof website === "string" && website.trim() !== "") {
    return Response.json({ ok: true });
  }

  if (!isNonEmptyString(name, 200)) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }
  if (!isNonEmptyString(email, 320) || !simpleEmailRe.test(email.trim())) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }
  const phoneStr = typeof phone === "string" ? phone : "";
  if (phoneStr.length > 80) {
    return Response.json({ error: "Invalid phone." }, { status: 400 });
  }
  if (!isNonEmptyString(message, 10_000)) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }

  const to = process.env.CONTACT_TO_EMAIL ?? site.contact.email;
  const n = name.trim();
  const e = email.trim();
  const p = phoneStr.trim();
  const m = message.trim();

  const text = [
    `Name: ${n}`,
    `Email: ${e}`,
    p ? `Phone: ${p}` : "Phone: (not provided)",
    "",
    "Message:",
    m,
  ].join("\n");

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: e,
    subject: `Website contact: ${n}`,
    text,
  });

  if (error) {
    console.error("[contact]", error);
    return Response.json({ error: "Could not send your message. Please try again or email us directly." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
