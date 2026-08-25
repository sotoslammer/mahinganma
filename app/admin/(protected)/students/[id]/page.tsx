import { notFound } from "next/navigation";
import { getStudentDetail } from "@/lib/admin/queries";
import { formatDate, formatDateTime, formatMoney, studentName } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { btnGhost, cardClass, inputClass, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { PROGRAMS } from "@/lib/programs";
import {
  addNote,
  createCheckoutLink,
  createPortalLink,
  linkStripeCustomer,
  sendStudentMessage,
  toggleConsent,
  updateStudentStatus,
} from "./actions";
import { MessageForm, RedirectButton } from "./forms";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getStudentDetail(id);
  if (!detail) notFound();
  const { student, waivers, enrollments, consents, notes, customer, subscriptions, payments, messages } = detail;
  const emailConsent = consents.find((row) => row.channel === "email");
  const smsConsent = consents.find((row) => row.channel === "sms");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.02em]">
            {studentName(student.firstName, student.lastName)}
          </h1>
          <p className="mt-1 text-sm text-dim">
            {student.email || "No email"} · {student.phone || "No phone"}
            {student.isMinor ? " · Minor" : ""}
            {student.dob ? ` · DOB ${student.dob}` : ""}
          </p>
        </div>
        <form action={updateStudentStatus} className="flex items-center gap-2">
          <input type="hidden" name="studentId" value={student.id} />
          <select name="status" defaultValue={student.status} className={inputClass}>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="inactive">Inactive</option>
            <option value="needs_review">Needs review</option>
          </select>
          <button className={btnGhost} type="submit">
            Save
          </button>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={cardClass}>
          <h2 className="text-lg font-medium">Programs</h2>
          <ul className="mt-3 space-y-2 text-sm text-dim">
            {enrollments.length === 0 ? <li>None yet.</li> : null}
            {enrollments.map((row) => (
              <li key={row.id} className="flex justify-between">
                <span>{row.program?.name ?? "Program"}</span>
                <StatusBadge value={row.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className={cardClass}>
          <h2 className="text-lg font-medium">Consent</h2>
          <div className="mt-3 space-y-2 text-sm">
            <ConsentRow studentId={student.id} channel="email" row={emailConsent} />
            <ConsentRow studentId={student.id} channel="sms" row={smsConsent} />
          </div>
        </section>
        <section className={cardClass}>
          <h2 className="text-lg font-medium">Stripe</h2>
          <p className="mt-2 text-sm text-dim">{customer?.stripeCustomerId ?? "Not linked"}</p>
          <div className="mt-3 space-y-2">
            <RedirectButton
              action={createCheckoutLink}
              label="Create checkout link"
              hidden={{ studentId: student.id, email: student.email ?? "" }}
            >
              <select name="programSlug" defaultValue={enrollments[0]?.program?.slug ?? "bjj"} className={inputClass}>
                {PROGRAMS.map((program) => (
                  <option key={program.slug} value={program.slug}>
                    {program.name}
                  </option>
                ))}
              </select>
            </RedirectButton>
            <RedirectButton
              action={createPortalLink}
              label="Open customer portal"
              hidden={{ studentId: student.id }}
            />
            <form action={linkStripeCustomer} className="flex gap-2">
              <input type="hidden" name="studentId" value={student.id} />
              <input name="stripeCustomerId" placeholder="cus_…" className={inputClass} />
              <button className={btnGhost} type="submit">
                Link
              </button>
            </form>
          </div>
        </section>
      </div>

      <section className={cardClass}>
        <h2 className="text-lg font-medium">Waivers</h2>
        <div className="mt-3 overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Signed</th>
                <th className={thClass}>Expires</th>
                <th className={thClass}>Tag</th>
                <th className={thClass}>Smartwaiver</th>
              </tr>
            </thead>
            <tbody>
              {waivers.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-dim`} colSpan={4}>
                    No waivers on file.
                  </td>
                </tr>
              ) : (
                waivers.map((waiver) => (
                  <tr key={waiver.id}>
                    <td className={tdClass}>{formatDate(waiver.signedAt)}</td>
                    <td className={tdClass}>{formatDate(waiver.expiresAt)}</td>
                    <td className={tdClass}>{waiver.autoTag || "—"}</td>
                    <td className={tdClass}>
                      <a
                        className="text-accent hover:text-accent-hover"
                        href={`https://www.smartwaiver.com/m/console/?unique_id=${encodeURIComponent(waiver.smartwaiverId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {waiver.smartwaiverId}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-medium">Payments</h2>
        <ul className="mt-3 space-y-2 text-sm text-dim">
          {subscriptions.map((sub) => (
            <li key={sub.id} className="flex justify-between gap-3">
              <span>
                {sub.productName || sub.priceId || sub.stripeSubscriptionId} · next {formatDate(sub.currentPeriodEnd)}
              </span>
              <StatusBadge value={sub.status} />
            </li>
          ))}
          {payments.map((payment) => (
            <li key={payment.id} className="flex justify-between gap-3">
              <span>
                {formatMoney(payment.amountPaid || payment.amountDue, payment.currency)} · {formatDate(payment.paidAt ?? payment.createdAt)}
              </span>
              <StatusBadge value={payment.status} />
            </li>
          ))}
          {subscriptions.length === 0 && payments.length === 0 ? <li>No Stripe history yet.</li> : null}
        </ul>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-medium">Message this student</h2>
        <div className="mt-4">
          <MessageForm
            action={sendStudentMessage}
            studentId={student.id}
            email={student.email}
            phone={student.phone}
          />
        </div>
        <ul className="mt-4 space-y-2 text-sm text-dim">
          {messages.map((message) => (
            <li key={message.id}>
              {formatDateTime(message.createdAt)} · {message.channel} · {message.status}
              {message.subject ? ` · ${message.subject}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-medium">Notes</h2>
        <form action={addNote} className="mt-3 space-y-2">
          <input type="hidden" name="studentId" value={student.id} />
          <textarea name="body" required rows={3} className={inputClass} placeholder="Add a note" />
          <button className={btnGhost} type="submit">
            Save note
          </button>
        </form>
        <ul className="mt-4 space-y-3 text-sm">
          {notes.map((note) => (
            <li key={note.id} className="border-t border-border-subtle pt-3">
              <p className="text-dim">
                {note.authorEmail} · {formatDateTime(note.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{note.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ConsentRow({
  studentId,
  channel,
  row,
}: {
  studentId: string;
  channel: "email" | "sms";
  row?: { granted: boolean; source: string } | null;
}) {
  const granted = Boolean(row?.granted);
  return (
    <form action={toggleConsent} className="flex items-center justify-between gap-3">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="granted" value={granted ? "true" : "false"} />
      <span className="capitalize">
        {channel} <StatusBadge value={granted ? "granted" : "revoked"} />
        {row?.source ? <span className="ml-2 text-dimmer">via {row.source}</span> : null}
      </span>
      <button className={btnGhost} type="submit">
        {granted ? "Revoke" : "Grant"}
      </button>
    </form>
  );
}
