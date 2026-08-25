import Link from "next/link";
import { dashboardStats } from "@/lib/admin/queries";
import { isAuthConfigured, isDatabaseConfigured, isResendConfigured, isSmartwaiverConfigured, isStripeConfigured, isTwilioConfigured } from "@/lib/config";
import { cardClass } from "@/components/admin/ui";

export default async function AdminHomePage() {
  const stats = await dashboardStats();
  const integrations = [
    { name: "Database", ok: isDatabaseConfigured() },
    { name: "Neon Auth", ok: isAuthConfigured() },
    { name: "Smartwaiver", ok: isSmartwaiverConfigured() },
    { name: "Stripe", ok: isStripeConfigured() },
    { name: "Resend", ok: isResendConfigured() },
    { name: "Twilio", ok: isTwilioConfigured() },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.02em]">Roster</h1>
        <p className="mt-1 text-sm text-dim">Students, waivers, payments, and messages in one place.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat href="/admin/students" label="Students" value={stats?.students ?? "—"} />
        <Stat href="/admin/reviews" label="Needs review" value={stats?.reviews ?? "—"} />
        <Stat href="/admin/payments" label="Active memberships" value={stats?.activeSubscriptions ?? "—"} />
        <Stat href="/admin/payments" label="Past due" value={stats?.pastDue ?? "—"} />
      </div>

      <section className={cardClass}>
        <h2 className="text-lg font-medium">Integrations</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {integrations.map((item) => (
            <li key={item.name} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm">
              <span>{item.name}</span>
              <span className={item.ok ? "text-[#7dffb4]" : "text-dim"}>{item.ok ? "Configured" : "Not set"}</span>
            </li>
          ))}
        </ul>
        {!isDatabaseConfigured() ? (
          <p className="mt-4 text-sm text-dim">
            Add <code className="text-[#eaeaea]">DATABASE_URL</code> and run <code className="text-[#eaeaea]">npm run db:migrate</code> to create tables.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: string | number }) {
  return (
    <Link href={href} className={`${cardClass} block transition hover:border-border-strong`}>
      <p className="text-[11px] uppercase tracking-[0.12em] text-dimmer">{label}</p>
      <p className="mt-2 text-3xl font-medium">{value}</p>
    </Link>
  );
}
