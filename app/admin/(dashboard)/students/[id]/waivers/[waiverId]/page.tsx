/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { WaiverDocument } from "@/components/signup/WaiverDocument";
import { requireAdmin } from "@/lib/auth";
import { formatDateOnly, formatDateTime, fullName } from "@/lib/format";
import { getWaiver } from "@/lib/students";

export async function generateMetadata({ params }: { params: Promise<{ id: string; waiverId: string }> }) {
  const { id, waiverId } = await params;
  const waiver = await getWaiver(id, waiverId);
  return {
    title: waiver
      ? `Waiver — ${fullName(waiver.student.firstName, waiver.student.lastName)}`
      : "Waiver",
  };
}

export default async function WaiverPage({
  params,
}: {
  params: Promise<{ id: string; waiverId: string }>;
}) {
  await requireAdmin();

  const { id, waiverId } = await params;
  const waiver = await getWaiver(id, waiverId);
  if (!waiver) notFound();

  const student = waiver.student;
  const studentName = fullName(student.firstName, student.lastName);
  const pdfHref = `/admin/students/${student.id}/waivers/${waiver.id}/pdf`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/students/${student.id}`} className="text-[13px] text-dim transition hover:text-[#eaeaea]">
          ← {studentName}
        </Link>
        <a
          className="rounded-[7px] bg-accent px-4 py-2 text-[13px] font-medium text-white transition hover:bg-accent-hover"
          href={pdfHref}
        >
          Download PDF
        </a>
      </div>

      <h1 className="mt-5 text-2xl font-medium tracking-[-0.02em]">{waiver.documentTitle}</h1>
      <p className="mt-1 text-sm text-dim">
        {studentName} · signed {formatDateTime(waiver.signedAt)} · version {waiver.version}
      </p>

      {/*
        The stored snapshot, shown verbatim. Editing the current waiver wording never
        changes what this record says was agreed to.
      */}
      <article className="mt-6 rounded-xl border border-border-subtle bg-surface p-5 md:p-7">
        <WaiverDocument documentText={waiver.documentText} />
      </article>

      <section className="mt-6 rounded-xl border border-border-subtle bg-surface p-5 md:p-7">
        <h2 className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-dimmer">
          Signature
        </h2>

        <div className="mt-4 inline-block rounded-lg border border-border-subtle bg-white p-2">
          {/*
            Served by an authenticated route rather than a public URL, and deliberately
            a plain <img>: next/image would proxy it through the optimizer, which caches
            derivatives of what is sensitive personal data.
          */}
          <img
            src={`/admin/students/${student.id}/waivers/${waiver.id}/signature`}
            alt={`Signature of ${waiver.signerName}`}
            width={Math.min(waiver.signatureWidth, 360)}
            height={
              waiver.signatureWidth > 0
                ? Math.round((Math.min(waiver.signatureWidth, 360) * waiver.signatureHeight) / waiver.signatureWidth)
                : 120
            }
            className="block h-auto w-full max-w-[360px]"
          />
        </div>

        <dl className="mt-5 grid gap-2.5 sm:grid-cols-2">
          <Row label="Printed name" value={waiver.signerName} />
          <Row
            label="Signed as"
            value={
              waiver.signerRole === "PARENT_GUARDIAN"
                ? `Parent or legal guardian${waiver.signerRelationship ? ` (${waiver.signerRelationship})` : ""}`
                : "The participant"
            }
          />
          <Row label="Participant" value={`${studentName} · born ${formatDateOnly(student.dateOfBirth)}`} />
          <Row label="Email on record" value={waiver.signerEmail} />
          <Row label="Signed at" value={formatDateTime(waiver.signedAt)} />
          <Row label="Photo and media consent" value={waiver.photoConsent ? "Granted" : "Not granted"} />
          <Row
            label="Copy sent to signer"
            value={waiver.confirmationSentAt ? formatDateTime(waiver.confirmationSentAt) : "Not sent"}
          />
          <Row label="Waiver version" value={waiver.version} />
        </dl>

        <div className="mt-5 border-t border-border-subtle pt-4">
          <h3 className="text-[11px] uppercase tracking-[0.12em] text-dimmer">Audit trail</h3>
          <p className="mt-2 text-xs leading-relaxed text-dimmer">
            Recorded from IP address {waiver.ipAddress ?? "not recorded"}.
            <br />
            Device: {waiver.userAgent ?? "not recorded"}
          </p>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-dimmer">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-[#eaeaea]">{value}</dd>
    </div>
  );
}
