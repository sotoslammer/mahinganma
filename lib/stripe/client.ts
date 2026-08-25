import Stripe from "stripe";

let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (cached) return cached;
  cached = new Stripe(key);
  return cached;
}

export function requireStripe(): Stripe {
  const stripe = getStripe();
  if (!stripe) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return stripe;
}

export function customerIdOf(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "id" in value && typeof value.id === "string") {
    return value.id;
  }
  return null;
}
