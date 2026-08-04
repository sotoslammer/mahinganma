import Link from "next/link";
import { ProgramBadge } from "@/components/admin/ProgramBadge";
import { requireAdmin } from "@/lib/auth";
import { formatDateOnly, formatDateTime, fullName } from "@/lib/format";
import { listStudents } from "@/lib/students";
import { PROGRAM_LABELS, PROGRAM_VALUES, ageOn, type ProgramValue } from "@/lib/validation/signup";

const controlClass =
  "rounded-lg border border-border-strong/40 bg-[#0a0a0a] px-3 py-2 text-sm text-[#eaeaea] outline-none transition focus:border-accent";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; minor?: string; program?: string }>;
}) {
  await requireAdmin();

  const filters = await searchParams;
  const { students, total, filtered } = await listStudents(filters);
  const isFiltered = Boolean(filters.q?.trim() || filters.minor || filters.program);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.02em] md:text-3xl">Students</h1>
          <p className="mt-1 text-sm text-dim">
            {isFiltered
              ? `${filtered} of ${total} ${total === 1 ? "student" : "students"}`
              : `${total} ${total === 1 ? "student" : "students"}`}
          </p>
        </div>
      </div>

      {/* A plain GET form: shareable, bookmarkable, and works without JavaScript. */}
      <form method="get" className="mt-6 flex flex-wrap items-center gap-2">
        <input
          className={`${controlClass} min-w-0 flex-1 md:max-w-xs`}
          type="search"
          name="q"
          placeholder="Search name, email or phone"
          defaultValue={filters.q ?? ""}
          aria-label="Search students"
        />
        <select
          className={controlClass}
          name="minor"
          defaultValue={filters.minor ?? ""}
          aria-label="Filter by age group"
        >
          <option value="">All ages</option>
          <option value="yes">Minors only</option>
          <option value="no">Adults only</option>
        </select>
        <select
          className={controlClass}
          name="program"
          defaultValue={filters.program ?? ""}
          aria-label="Filter by program"
        >
          <option value="">All programs</option>
          {PROGRAM_VALUES.map((value) => (
            <option key={value} value={value}>
              {PROGRAM_LABELS[value]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-[7px] bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover active:scale-[0.98]"
        >
          Apply
        </button>
        {isFiltered && (
          <Link
            href="/admin"
            className="text-sm text-dim underline decoration-dimmer underline-offset-[3px] transition hover:text-[#eaeaea]"
          >
            Clear
          </Link>
        )}
      </form>

      {students.length === 0 ? (
        <p className="mt-10 rounded-xl border border-border-subtle bg-surface px-5 py-10 text-center text-sm text-dim">
          {isFiltered
            ? "No students match those filters."
            : "No signups yet. They will appear here as soon as someone signs up through the website."}
        </p>
      ) : (
        <>
          {/* Mobile: one card per student. */}
          <ul className="mt-6 flex flex-col gap-2.5 md:hidden">
            {students.map((student) => (
              <li key={student.id}>
                <Link
                  href={`/admin/students/${student.id}`}
                  className="block rounded-xl border border-border-subtle bg-surface p-4 transition hover:border-border-strong"
                >
                  <div className="flex items-center gap-2">
                    <ProgramBadge program={student.program as ProgramValue} />
                    <span className="flex-1 truncate text-[15px] font-medium">
                      {fullName(student.firstName, student.lastName)}
                    </span>
                    {student.isMinor && (
                      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-dim">
                        Minor
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-dim">
                    Age {ageOn(student.dateOfBirth, new Date())} ·{" "}
                    {student._count.waivers === 1
                      ? "1 waiver"
                      : `${student._count.waivers} waivers`}{" "}
                    · Joined {formatDateOnly(student.createdAt)}
                  </p>
                  {(student.email || student.guardianEmail) && (
                    <p className="mt-1 truncate text-xs text-dimmer">
                      {student.isMinor ? student.guardianEmail : student.email}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table. */}
          <div className="mt-6 hidden overflow-hidden rounded-[14px] border border-border-subtle bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] uppercase tracking-[0.08em] text-dimmer">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Age</th>
                  <th className="px-5 py-3 font-medium">Program</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Waivers</th>
                  <th className="px-5 py-3 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border-subtle transition last:border-b-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="font-medium text-[#eaeaea] transition hover:text-accent"
                      >
                        {fullName(student.firstName, student.lastName)}
                      </Link>
                      {student.isMinor && (
                        <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-dim">
                          Minor
                        </span>
                      )}
                      {student.isMinor && (
                        <div className="mt-0.5 text-xs text-dimmer">
                          Guardian: {fullName(student.guardianFirstName, student.guardianLastName) || "—"}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-dim">{ageOn(student.dateOfBirth, new Date())}</td>
                    <td className="px-5 py-3">
                      <ProgramBadge program={student.program as ProgramValue} />
                    </td>
                    <td className="px-5 py-3 text-dim">
                      <div className="max-w-[220px] truncate">
                        {(student.isMinor ? student.guardianEmail : student.email) || "—"}
                      </div>
                      {student.phone && <div className="text-xs text-dimmer">{student.phone}</div>}
                    </td>
                    <td className="px-5 py-3 text-dim">{student._count.waivers}</td>
                    <td className="px-5 py-3 text-dim" title={formatDateTime(student.createdAt)}>
                      {formatDateOnly(student.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
