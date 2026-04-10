import { Resend } from "resend";
import { z } from "zod";
import { site } from "@/lib/site";

export const runtime = "nodejs";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const contactBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z.string().trim().email("A valid email is required.").max(320),
  phone: z
    .unknown()
    .transform((v) => (typeof v === "string" ? v : ""))
    .pipe(z.string().max(80, "Invalid phone.")),
  message: z.string().trim().min(1, "Message is required.").max(10_000),
  website: z
    .unknown()
    .transform((v) => (typeof v === "string" ? v : ""))
    .pipe(z.string()),
});

type PublicSubmitted = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

function submittedFromUnknown(payload: unknown): PublicSubmitted | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }
  const o = payload as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" ? o[k] : "");
  const snap: PublicSubmitted = {
    name: str("name"),
    email: str("email"),
    phone: str("phone"),
    message: str("message"),
  };
  if (!snap.name && !snap.email && !snap.phone && !snap.message) {
    return undefined;
  }
  return snap;
}

function publicSubmitted(data: PublicSubmitted): PublicSubmitted {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactBodySchema.safeParse(payload);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request.";
    const submitted = submittedFromUnknown(payload);
    return Response.json(
      submitted ? { error: msg, submitted } : { error: msg },
      { status: 400 },
    );
  }

  const { name: n, email: e, phone: p, message: m, website } = parsed.data;
  const snap = publicSubmitted({ name: n, email: e, phone: p, message: m });

  if (website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const from = process.env.RESEND_FROM;
  if (!resend || !process.env.RESEND_API_KEY || !from) {
    return Response.json(
      { error: "Email is not configured on the server.", submitted: snap },
      { status: 503 },
    );
  }

  const to = process.env.CONTACT_TO_EMAIL ?? site.contact.email;

  const text = [
    `Name: ${n}`,
    `Email: ${e}`,
    p.trim() ? `Phone: ${p.trim()}` : "Phone: (not provided)",
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
    return Response.json(
      {
        error: "Could not send your message. Please try again or email us directly.",
        submitted: snap,
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
