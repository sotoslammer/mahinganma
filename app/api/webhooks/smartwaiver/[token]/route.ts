import { ingestWaiver } from "@/lib/smartwaiver/ingest";
import { isDatabaseConfigured, isSmartwaiverConfigured } from "@/lib/config";
import { safeEqual } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const expected = process.env.SMARTWAIVER_WEBHOOK_TOKEN?.trim();
  const { token } = await context.params;
  if (!expected || !safeEqual(token, expected)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  if (!isDatabaseConfigured() || !isSmartwaiverConfigured()) {
    return Response.json({ error: "Smartwaiver ingest is not configured." }, { status: 503 });
  }

  let payload: unknown;
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      payload = Object.fromEntries(form.entries());
    } else {
      payload = await request.json();
    }
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const uniqueId =
    (typeof record.unique_id === "string" && record.unique_id) ||
    (typeof record.uniqueId === "string" && record.uniqueId) ||
    (record.payload && typeof record.payload === "object"
      ? String((record.payload as Record<string, unknown>).unique_id ?? "")
      : "");
  if (!uniqueId) {
    return Response.json({ error: "Missing unique_id." }, { status: 400 });
  }

  try {
    await ingestWaiver(uniqueId, "webhook");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[smartwaiver webhook]", error);
    return Response.json({ error: "Failed to ingest waiver." }, { status: 500 });
  }
}
