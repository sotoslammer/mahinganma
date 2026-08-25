import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { requireDb } from "@/lib/db";
import { writeAudit } from "@/lib/db/audit";
import { claimWebhookEvent } from "@/lib/db/webhooks";
import { stripeCustomers, stripePayments, stripeSubscriptions, students, syncState } from "@/lib/db/schema";
import { customerIdOf, requireStripe } from "@/lib/stripe/client";
import { normalizeEmail } from "@/lib/crypto";

async function linkStudentByEmail(email: string | null): Promise<string | null> {
  if (!email) return null;
  const db = requireDb();
  const [row] = await db.select({ id: students.id }).from(students).where(eq(students.email, email)).limit(1);
  return row?.id ?? null;
}

export async function upsertStripeCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer) {
  if (customer.deleted) return;
  const db = requireDb();
  const email = normalizeEmail(customer.email);
  const studentId = await linkStudentByEmail(email);
  const existing = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.stripeCustomerId, customer.id))
    .limit(1);
  const values = {
    stripeCustomerId: customer.id,
    studentId: existing[0]?.studentId ?? studentId,
    email,
    name: customer.name ?? null,
    raw: customer as unknown as Record<string, unknown>,
    updatedAt: new Date(),
  };
  if (existing[0]) {
    await db.update(stripeCustomers).set(values).where(eq(stripeCustomers.id, existing[0].id));
  } else {
    await db.insert(stripeCustomers).values(values);
  }
}

export async function upsertStripeSubscription(subscription: Stripe.Subscription) {
  const db = requireDb();
  const item = subscription.items.data[0];
  const price = item?.price;
  const periodEndSeconds =
    "current_period_end" in subscription && typeof subscription.current_period_end === "number"
      ? subscription.current_period_end
      : item && "current_period_end" in item && typeof item.current_period_end === "number"
        ? item.current_period_end
        : null;
  const values = {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerIdOf(subscription.customer) ?? "",
    status: subscription.status,
    priceId: typeof price === "string" ? price : price?.id ?? null,
    productName:
      price && typeof price !== "string" && typeof price.product === "object" && price.product && "name" in price.product
        ? String(price.product.name)
        : null,
    currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    raw: subscription as unknown as Record<string, unknown>,
    updatedAt: new Date(),
  };
  const existing = await db
    .select({ id: stripeSubscriptions.id })
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);
  if (existing[0]) {
    await db.update(stripeSubscriptions).set(values).where(eq(stripeSubscriptions.id, existing[0].id));
  } else {
    await db.insert(stripeSubscriptions).values(values);
  }
}

export async function upsertStripeInvoice(invoice: Stripe.Invoice) {
  const db = requireDb();
  const paidAt =
    invoice.status_transitions?.paid_at != null
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : invoice.status === "paid"
        ? new Date()
        : null;
  const values = {
    stripeInvoiceId: invoice.id ?? `inv_${Date.now()}`,
    stripeCustomerId: customerIdOf(invoice.customer),
    amountDue: invoice.amount_due ?? 0,
    amountPaid: invoice.amount_paid ?? 0,
    currency: invoice.currency ?? "cad",
    status: invoice.status ?? "open",
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    paidAt,
    raw: invoice as unknown as Record<string, unknown>,
    updatedAt: new Date(),
  };
  const existing = await db
    .select({ id: stripePayments.id })
    .from(stripePayments)
    .where(eq(stripePayments.stripeInvoiceId, values.stripeInvoiceId))
    .limit(1);
  if (existing[0]) {
    await db.update(stripePayments).set(values).where(eq(stripePayments.id, existing[0].id));
  } else {
    await db.insert(stripePayments).values(values);
  }
}

export async function handleStripeEvent(event: Stripe.Event): Promise<{ ok: true } | { skipped: true }> {
  const claimed = await claimWebhookEvent({
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    payload: event.data.object as unknown as Record<string, unknown>,
  });
  if (!claimed) return { skipped: true };

  switch (event.type) {
    case "customer.created":
    case "customer.updated":
      await upsertStripeCustomer(event.data.object as Stripe.Customer);
      break;
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = customerIdOf(session.customer);
      if (customerId) {
        const stripe = requireStripe();
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted) await upsertStripeCustomer(customer);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertStripeSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.finalized":
      await upsertStripeInvoice(event.data.object as Stripe.Invoice);
      break;
    default:
      break;
  }

  await writeAudit({
    action: "stripe.event",
    entityType: "stripe_event",
    entityId: event.id,
    metadata: { type: event.type },
  });
  return { ok: true };
}

export async function reconcileStripe(): Promise<{ customers: number; subscriptions: number; invoices: number }> {
  const stripe = requireStripe();
  const db = requireDb();
  let customers = 0;
  let subscriptions = 0;
  let invoices = 0;

  for await (const customer of stripe.customers.list({ limit: 100 })) {
    await upsertStripeCustomer(customer);
    customers += 1;
  }
  for await (const subscription of stripe.subscriptions.list({ limit: 100, status: "all", expand: ["data.items.data.price"] })) {
    await upsertStripeSubscription(subscription);
    subscriptions += 1;
  }
  for await (const invoice of stripe.invoices.list({ limit: 100 })) {
    await upsertStripeInvoice(invoice);
    invoices += 1;
  }

  await db
    .insert(syncState)
    .values({
      provider: "stripe",
      lastSyncedAt: new Date(),
      metadata: { customers, subscriptions, invoices },
    })
    .onConflictDoUpdate({
      target: syncState.provider,
      set: {
        lastSyncedAt: new Date(),
        metadata: { customers, subscriptions, invoices },
        updatedAt: new Date(),
      },
    });

  return { customers, subscriptions, invoices };
}
