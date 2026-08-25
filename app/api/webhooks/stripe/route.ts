import { handleStripeEvent } from "@/lib/stripe/ingest";
import { getStripe } from "@/lib/stripe/client";
import { isDatabaseConfigured } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret || !isDatabaseConfigured()) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature." }, { status: 400 });
  }
  const raw = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    console.error("[stripe webhook signature]", error);
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }
  try {
    await handleStripeEvent(event);
    return Response.json({ received: true });
  } catch (error) {
    console.error("[stripe webhook]", error);
    return Response.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
