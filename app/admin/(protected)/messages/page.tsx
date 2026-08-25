import { listMessages } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { cardClass, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { Composer } from "./composer";

export default async function MessagesPage() {
  const history = await listMessages();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.02em]">Messages</h1>
        <p className="mt-1 text-sm text-dim">
          Marketing sends require consent. Transactional notes (waiver expiry, failed payment) do not.
        </p>
      </div>
      <Composer />
      <section className={cardClass}>
        <h2 className="text-lg font-medium">History</h2>
        <div className="mt-3 overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Channel</th>
                <th className={thClass}>To</th>
                <th className={thClass}>Subject</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-dim`} colSpan={5}>
                    No messages sent yet.
                  </td>
                </tr>
              ) : (
                history.map((message) => (
                  <tr key={message.id}>
                    <td className={tdClass}>{formatDateTime(message.createdAt)}</td>
                    <td className={`${tdClass} capitalize`}>{message.channel}</td>
                    <td className={tdClass}>{message.toAddress}</td>
                    <td className={tdClass}>{message.subject || "—"}</td>
                    <td className={tdClass}>
                      <StatusBadge value={message.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
