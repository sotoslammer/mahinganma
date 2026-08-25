import { authorizeCron, cronUnauthorized } from "@/lib/cron";
import { isDatabaseConfigured, isStripeConfigured } from "@/lib/config";
import { reconcileStripe } from "@/lib/stripe/ingest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeCron(request)) return cronUnauthorized();
  if (!isDatabaseConfigured() || !isStripeConfigured()) {
    return Response.json({ error: "Stripe sync is not configured." }, { status: 503 });
  }
  try {
    const result = await reconcileStripe();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("[stripe cron]", error);
    return Response.json({ error: "Stripe reconcile failed." }, { status: 500 });
  }
}
