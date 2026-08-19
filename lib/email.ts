import { Resend } from "resend";
import { getPrisma } from "@/lib/db";
import { formatDateOnly, formatDateTime, fullName } from "@/lib/format";
import { PROGRAM_LABELS, ageOn, type ProgramValue } from "@/lib/validation/signup";
import { renderWaiverPdf, waiverFileName } from "@/lib/waiver-pdf";
import { site } from "@/lib/site";

/**
 * Signup mail: a notification to the owner and a copy of the signed waiver to whoever
 * signed it. Both carry the same PDF.
 *
 * Nothing here is allowed to fail a signup. The waiver is already committed by the
 * time this runs, so every send is isolated and errors are logged rather than thrown.
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function ownerRecipient(): string {
  return process.env.SIGNUP_NOTIFY_EMAIL || process.env.CONTACT_TO_EMAIL || site.contact.email;
}

function line(label: string, value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? `${label}: ${trimmed}` : null;
}

export async function sendSignupEmails({
  studentId,
  waiverId,
}: {
  studentId: string;
  waiverId: string;
}): Promise<void> {
  const from = process.env.RESEND_FROM;
  if (!resend || !from) {
    console.warn(
      `[signup] RESEND_API_KEY or RESEND_FROM is not configured; skipping notification and confirmation for student ${studentId}.`,
    );
    return;
  }

  const prisma = getPrisma();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { waivers: { where: { id: waiverId } } },
  });
  const waiver = student?.waivers[0];
  if (!student || !waiver) {
    console.error(`[signup] could not load student ${studentId} / waiver ${waiverId} for email.`);
    return;
  }

  const studentName = fullName(student.firstName, student.lastName);
  const guardianName = fullName(student.guardianFirstName, student.guardianLastName);
  const age = ageOn(student.dateOfBirth, waiver.signedAt);

  let attachment: { filename: string; content: string } | undefined;
  try {
    const pdf = await renderWaiverPdf({
      student,
      waiver: {
        ...waiver,
        signerRole: waiver.signerRole as "SELF" | "PARENT_GUARDIAN",
      },
      organizationName: site.name,
    });
    attachment = {
      filename: waiverFileName(student, waiver.signedAt),
      content: Buffer.from(pdf).toString("base64"),
    };
  } catch (error) {
    // Still worth sending the notifications; the waiver remains readable in /admin.
    console.error(`[signup] could not build waiver PDF for ${waiverId}`, error);
  }

  const adminUrl = `${site.url}/admin/students/${student.id}`;

  const ownerBody = [
    `${studentName} signed up through the website.`,
    "",
    ...[
      line("Student", studentName),
      line("Date of birth", `${formatDateOnly(student.dateOfBirth)} (age ${age})`),
      line("Minor", student.isMinor ? "Yes — signed by parent or guardian" : "No"),
      line("Program", PROGRAM_LABELS[student.program as ProgramValue]),
      line("Student email", student.email),
      line("Student phone", student.phone),
    ].filter(Boolean),
    ...(student.isMinor
      ? [
          "",
          "Parent or guardian",
          ...[
            line("Name", guardianName),
            line("Relationship", student.guardianRelationship),
            line("Email", student.guardianEmail),
            line("Phone", student.guardianPhone),
          ].filter(Boolean),
        ]
      : []),
    "",
    "Emergency contact",
    ...[
      line("Name", student.emergencyName),
      line("Phone", student.emergencyPhone),
      line("Relationship", student.emergencyRelationship),
    ].filter(Boolean),
    ...(student.experience?.trim() ? ["", "Experience", student.experience.trim()] : []),
    ...(student.medicalNotes?.trim()
      ? ["", "Medical notes / allergies", student.medicalNotes.trim()]
      : []),
    "",
    "Waiver",
    ...[
      line("Signed by", `${waiver.signerName} (${waiver.signerRole === "SELF" ? "the student" : "parent or guardian"})`),
      line("Signed at", formatDateTime(waiver.signedAt)),
      line("Version", waiver.version),
      line("Photo and media consent", waiver.photoConsent ? "Granted" : "Not granted"),
    ].filter(Boolean),
    "",
    `Full record: ${adminUrl}`,
  ].join("\n");

  await send({
    from,
    to: ownerRecipient(),
    replyTo: waiver.signerEmail,
    subject: `New signup: ${studentName}${student.isMinor ? " (minor)" : ""}`,
    text: ownerBody,
    attachment,
    context: `owner notification for ${studentId}`,
  });

  const signerBody = [
    `Hi ${waiver.signerName.split(/\s+/)[0] ?? "there"},`,
    "",
    student.isMinor
      ? `Thanks for signing ${studentName} up at ${site.name}. A copy of the waiver you signed is attached for your records.`
      : `Thanks for signing up at ${site.name}. A copy of the waiver you signed is attached for your records.`,
    "",
    "What happens next: we will be in touch to confirm a first class. Just bring comfortable clothes and a water bottle — we have everything else you need.",
    "",
    `Signed by: ${waiver.signerName}`,
    `Signed at: ${formatDateTime(waiver.signedAt)}`,
    "",
    "If you did not sign this, please reply to this email and let us know.",
    "",
    site.name,
    site.contact.addressLines.join(", "),
    site.contact.phone,
  ].join("\n");

  const confirmationSent = await send({
    from,
    to: waiver.signerEmail,
    replyTo: ownerRecipient(),
    subject: `Your signed waiver — ${site.name}`,
    text: signerBody,
    attachment,
    context: `signer confirmation for ${waiverId}`,
  });

  if (confirmationSent) {
    // Lets the owner see at a glance whether the signer actually got their copy.
    await prisma.waiver
      .update({ where: { id: waiverId }, data: { confirmationSentAt: new Date() } })
      .catch((error) => console.error(`[signup] could not stamp confirmationSentAt`, error));
  }
}

async function send({
  from,
  to,
  replyTo,
  subject,
  text,
  attachment,
  context,
}: {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  attachment?: { filename: string; content: string };
  context: string;
}): Promise<boolean> {
  if (!resend) return false;
  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo,
      subject,
      text,
      attachments: attachment ? [attachment] : undefined,
    });
    if (error) {
      console.error(`[signup] Resend rejected ${context}`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[signup] could not send ${context}`, error);
    return false;
  }
}
