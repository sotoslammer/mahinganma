import Link from "next/link";
import { listPayments } from "@/lib/admin/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { cardClass, tableClass, tdClass, thClass } from "@/components/admin/ui";

export default async function PaymentsPage() {
  const { subscriptions, payments, customers } = await listPayments();
  const customerByStripeId = new Map(customers.map((row) => [row.stripeCustomerId, row]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.02em]">Payments</h1>
        <p className="mt-1 text-sm text-dim">Stripe is the billing source of truth. This page mirrors membership status.</p>
      </div>

      <section className={cardClass}>
        <h2 className="text-lg font-medium">Subscriptions</h2>
        <div className="mt-3 overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Plan</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Next invoice</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-dim`} colSpan={4}>
                    No subscriptions yet.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const customer = customerByStripeId.get(sub.stripeCustomerId);
                  return (
                    <tr key={sub.id}>
                      <td className={tdClass}>
                        {customer?.studentId ? (
                          <Link href={`/admin/students/${customer.studentId}`} className="hover:text-white">
                            {customer.email || customer.stripeCustomerId}
                          </Link>
                        ) : (
                          customer?.email || sub.stripeCustomerId
                        )}
                      </td>
                      <td className={tdClass}>{sub.productName || sub.priceId || "—"}</td>
                      <td className={tdClass}>
                        <StatusBadge value={sub.status} />
                      </td>
                      <td className={tdClass}>{formatDate(sub.currentPeriodEnd)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-medium">Invoices</h2>
        <div className="mt-3 overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Amount</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-dim`} colSpan={4}>
                    No invoices yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const customer = payment.stripeCustomerId
                    ? customerByStripeId.get(payment.stripeCustomerId)
                    : undefined;
                  return (
                    <tr key={payment.id}>
                      <td className={tdClass}>
                        {customer?.studentId ? (
                          <Link href={`/admin/students/${customer.studentId}`} className="hover:text-white">
                            {customer.email || payment.stripeCustomerId}
                          </Link>
                        ) : (
                          customer?.email || payment.stripeCustomerId || "—"
                        )}
                      </td>
                      <td className={tdClass}>{formatMoney(payment.amountPaid || payment.amountDue, payment.currency)}</td>
                      <td className={tdClass}>
                        <StatusBadge value={payment.status} />
                      </td>
                      <td className={tdClass}>{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
