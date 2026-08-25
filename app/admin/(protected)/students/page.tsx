import Link from "next/link";
import { listStudents } from "@/lib/admin/queries";
import { PROGRAMS } from "@/lib/programs";
import { formatDate, studentName } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { btnGhost, inputClass, tableClass, tdClass, thClass } from "@/components/admin/ui";
import { isDatabaseConfigured } from "@/lib/config";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; program?: string; status?: string; waiver?: string }>;
}) {
  const params = await searchParams;
  const waiver = ["valid", "expired", "missing", "expiring"].includes(params.waiver ?? "")
    ? (params.waiver as "valid" | "expired" | "missing" | "expiring")
    : undefined;
  const rows = isDatabaseConfigured()
    ? await listStudents({
        q: params.q,
        program: params.program,
        status: params.status,
        waiver,
      })
    : [];
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, value]) => Boolean(value))) as Record<string, string>,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.02em]">Students</h1>
          <p className="mt-1 text-sm text-dim">{rows.length} matching {rows.length === 1 ? "record" : "records"}.</p>
        </div>
        <a className={btnGhost} href={`/admin/students/export?${query.toString()}`}>
          Export CSV
        </a>
      </div>

      <form className="grid gap-3 rounded-[14px] border border-border-subtle bg-surface p-4 md:grid-cols-4">
        <input name="q" defaultValue={params.q} placeholder="Search name, email, phone" className={inputClass} />
        <select name="program" defaultValue={params.program ?? ""} className={inputClass}>
          <option value="">All programs</option>
          {PROGRAMS.map((program) => (
            <option key={program.slug} value={program.slug}>
              {program.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
          <option value="needs_review">Needs review</option>
        </select>
        <div className="flex gap-2">
          <select name="waiver" defaultValue={params.waiver ?? ""} className={inputClass}>
            <option value="">All waivers</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring (30d)</option>
            <option value="expired">Expired</option>
            <option value="missing">Missing</option>
          </select>
          <button type="submit" className={btnGhost}>
            Filter
          </button>
        </div>
      </form>

      {!isDatabaseConfigured() ? (
        <p className="text-sm text-dim">Database is not configured yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-border-subtle">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Contact</th>
                <th className={thClass}>Programs</th>
                <th className={thClass}>Waiver</th>
                <th className={thClass}>Payment</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-dim`} colSpan={6}>
                    No students yet. Signed Smartwaiver records will appear here after the webhook or cron runs.
                  </td>
                </tr>
              ) : (
                rows.map(({ student, programSlugs, waiver: waiverRow, subscription }) => (
                  <tr key={student.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/students/${student.id}`} className="font-medium hover:text-white">
                        {studentName(student.firstName, student.lastName)}
                      </Link>
                      {student.isMinor ? <span className="ml-2 text-[11px] text-dim">Minor</span> : null}
                    </td>
                    <td className={`${tdClass} text-dim`}>
                      <div>{student.email || "—"}</div>
                      <div>{student.phone || ""}</div>
                    </td>
                    <td className={`${tdClass} capitalize text-dim`}>{programSlugs.join(", ") || "—"}</td>
                    <td className={tdClass}>
                      {waiverRow ? formatDate(waiverRow.expiresAt ?? waiverRow.signedAt) : "—"}
                    </td>
                    <td className={tdClass}>
                      <StatusBadge value={subscription?.status ?? "none"} />
                    </td>
                    <td className={tdClass}>
                      <StatusBadge value={student.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
