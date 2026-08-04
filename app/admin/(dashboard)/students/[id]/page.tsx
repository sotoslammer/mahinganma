import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgramBadge } from "@/components/admin/ProgramBadge";
import { requireAdmin } from "@/lib/auth";
import { formatDateOnly, formatDateTime, fullName } from "@/lib/format";
import { getStudent } from "@/lib/students";
import { PROGRAM_LABELS, ageOn, type ProgramValue } from "@/lib/validation/signup";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id);
  return { title: student ? fullName(student.firstName, student.lastName) : "Student" };
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const student = await getStudent(id);
  if (!student) notFound();

  const name = fullName(student.firstName, student.lastName);
  const age = ageOn(student.dateOfBirth, new Date());

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin"
        className="text-[13px] text-dim transition hover:text-[#eaeaea]"
      >
        ← All students
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-medium tracking-[-0.02em] md:text-3xl">{name}</h1>
        <ProgramBadge program={student.program as ProgramValue} />
        {student.isMinor && (
          <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-dim">
            Minor
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-dim">
        Age {age} · Signed up {formatDateTime(student.createdAt)}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card title="Student">
          <Row label="Full name" value={name} />
          <Row label="Date of birth" value={`${formatDateOnly(student.dateOfBirth)} (age ${age})`} />
          <Row label="Program" value={PROGRAM_LABELS[student.program as ProgramValue]} />
          <Row label="Email" value={student.email} href={student.email ? `mailto:${student.email}` : undefined} />
          <Row label="Phone" value={student.phone} href={student.phone ? `tel:${student.phone.replace(/\D/g, "")}` : undefined} />
          <Row label="Experience" value={student.experience} />
        </Card>

        {student.isMinor && (
          <Card title="Parent or legal guardian">
            <Row label="Name" value={fullName(student.guardianFirstName, student.guardianLastName)} />
            <Row label="Relationship" value={student.guardianRelationship} />
            <Row
              label="Email"
              value={student.guardianEmail}
              href={student.guardianEmail ? `mailto:${student.guardianEmail}` : undefined}
            />
            <Row
              label="Phone"
              value={student.guardianPhone}
              href={student.guardianPhone ? `tel:${student.guardianPhone.replace(/\D/g, "")}` : undefined}
            />
          </Card>
        )}

        <Card title="Emergency contact">
          <Row label="Name" value={student.emergencyName} />
          <Row
            label="Phone"
            value={student.emergencyPhone}
            href={`tel:${student.emergencyPhone.replace(/\D/g, "")}`}
          />
          <Row label="Relationship" value={student.emergencyRelationship} />
        </Card>

        <Card title="Medical notes">
          {student.medicalNotes?.trim() ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#eaeaea]">
              {student.medicalNotes}
            </p>
          ) : (
            <p className="text-sm text-dimmer">None provided.</p>
          )}
        </Card>
      </div>

      <h2 className="mt-10 text-lg font-medium">Signed waivers</h2>
      {student.waivers.length === 0 ? (
        <p className="mt-3 rounded-xl border border-border-subtle bg-surface px-5 py-6 text-sm text-dim">
          No waiver on file for this student.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {student.waivers.map((waiver) => (
            <li
              key={waiver.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Signed by {waiver.signerName}
                  <span className="ml-2 text-xs font-normal text-dim">
                    {waiver.signerRole === "PARENT_GUARDIAN"
                      ? `parent or guardian${waiver.signerRelationship ? ` · ${waiver.signerRelationship}` : ""}`
                      : "the student"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-dim">
                  {formatDateTime(waiver.signedAt)} · version {waiver.version}
                </p>
                <p className="mt-0.5 text-xs text-dimmer">
                  Copy emailed to {waiver.signerEmail}
                  {waiver.confirmationSentAt
                    ? ` on ${formatDateOnly(waiver.confirmationSentAt)}`
                    : " — not sent"}
                  {" · "}
                  Photo consent {waiver.photoConsent ? "granted" : "not granted"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[13px]">
                <Link
                  className="rounded-[7px] border border-border-strong/40 px-3 py-1.5 transition hover:border-accent hover:text-accent"
                  href={`/admin/students/${student.id}/waivers/${waiver.id}`}
                >
                  View
                </Link>
                <a
                  className="rounded-[7px] bg-accent px-3 py-1.5 font-medium text-white transition hover:bg-accent-hover"
                  href={`/admin/students/${student.id}/waivers/${waiver.id}/pdf`}
                >
                  PDF
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-5">
      <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-dimmer">
        {title}
      </h2>
      <dl className="mt-3 flex flex-col gap-2.5">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string;
}) {
  const text = value?.trim();
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-3">
      <dt className="text-xs text-dimmer">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-[#eaeaea]">
        {text ? (
          href ? (
            <a className="underline decoration-dimmer underline-offset-[3px] transition hover:text-accent" href={href}>
              {text}
            </a>
          ) : (
            text
          )
        ) : (
          <span className="text-dimmer">—</span>
        )}
      </dd>
    </div>
  );
}
