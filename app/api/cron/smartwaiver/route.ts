import { authorizeCron, cronUnauthorized } from "@/lib/cron";
import { isDatabaseConfigured, isSmartwaiverConfigured } from "@/lib/config";
import { backfillSmartwaiver, drainSmartwaiverQueue } from "@/lib/smartwaiver/ingest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeCron(request)) return cronUnauthorized();
  if (!isDatabaseConfigured() || !isSmartwaiverConfigured()) {
    return Response.json({ error: "Smartwaiver sync is not configured." }, { status: 503 });
  }
  try {
    const queue = await drainSmartwaiverQueue();
    const backfill = await backfillSmartwaiver();
    return Response.json({ ok: true, queue, backfill });
  } catch (error) {
    console.error("[smartwaiver cron]", error);
    return Response.json({ error: "Smartwaiver sync failed." }, { status: 500 });
  }
}
