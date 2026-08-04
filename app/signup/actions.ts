"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { fullName, namesMatch } from "@/lib/format";
import { sendSignupEmails } from "@/lib/email";
import { PROGRAM_LABELS, decodeSignature, isMinorOn, parseIsoDate, signupSchema } from "@/lib/validation/signup";
import { WAIVER_TITLE, WAIVER_VERSION, renderWaiverText } from "@/lib/waiver";

export type SignupState = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** Best-effort client IP. Absent or spoofable behind some proxies, so it is evidence, not proof. */
async function requestMetadata() {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() || headerList.get("x-real-ip")?.trim() || null;
  return { ipAddress, userAgent: headerList.get("user-agent")?.slice(0, 500) ?? null };
}

export async function submitSignup(
  _previous: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] ??= issue.message;
    }
    return { message: "Please check the highlighted fields and try again.", fieldErrors };
  }

  const data = parsed.data;

  // Bots fill every field they find, including the one hidden off-screen. Report
  // success so they learn nothing, but record nothing.
  if (data.website.trim() !== "") {
    redirect("/signup/thanks");
  }

  // Re-derive rather than trust: the browser decides what to show, the server decides
  // what is true. A forged payload cannot turn a minor into an adult signing for themself.
  const dateOfBirth = parseIsoDate(data.dateOfBirth);
  if (!dateOfBirth) {
    return { fieldErrors: { dateOfBirth: "Enter a valid date of birth." } };
  }
  const isMinor = isMinorOn(dateOfBirth, new Date());

  const studentName = fullName(data.firstName, data.lastName);
  const guardianName = fullName(data.guardianFirstName, data.guardianLastName);
  const expectedSigner = isMinor ? guardianName : studentName;

  if (!namesMatch(data.signerName, expectedSigner)) {
    return {
      fieldErrors: {
        signerName: isMinor
          ? `This must match the parent or guardian named above (${guardianName}).`
          : `This must match the student's name above (${studentName}).`,
      },
    };
  }

  const signature = decodeSignature(data.signatureData);
  if (!signature.ok) {
    return { fieldErrors: { signatureData: signature.error } };
  }

  const documentText = renderWaiverText({
    studentName,
    studentDateOfBirth: dateOfBirth,
    isMinor,
    guardianName,
    guardianRelationship: data.guardianRelationship,
    programLabel: PROGRAM_LABELS[data.program],
  });

  const { ipAddress, userAgent } = await requestMetadata();
  const signerEmail = isMinor ? data.guardianEmail : data.email;

  let studentId: string;
  let waiverId: string;
  try {
    const student = await prisma.student.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth,
        isMinor,
        email: data.email || null,
        phone: data.phone || null,
        program: data.program,
        experience: data.experience || null,
        guardianFirstName: isMinor ? data.guardianFirstName : null,
        guardianLastName: isMinor ? data.guardianLastName : null,
        guardianRelationship: isMinor ? data.guardianRelationship : null,
        guardianEmail: isMinor ? data.guardianEmail : null,
        guardianPhone: isMinor ? data.guardianPhone : null,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        emergencyRelationship: data.emergencyRelationship || null,
        medicalNotes: data.medicalNotes || null,
        // Nested create keeps the student and their waiver in one transaction, so a
        // student can never be recorded without the waiver they signed.
        waivers: {
          create: [
            {
              version: WAIVER_VERSION,
              documentTitle: WAIVER_TITLE,
              documentText,
              signerName: data.signerName,
              signerRole: isMinor ? "PARENT_GUARDIAN" : "SELF",
              signerRelationship: isMinor ? data.guardianRelationship : null,
              signerEmail,
              photoConsent: data.photoConsent,
              signatureImage: signature.bytes,
              signatureWidth: signature.width,
              signatureHeight: signature.height,
              ipAddress,
              userAgent,
            },
          ],
        },
      },
      select: { id: true, waivers: { select: { id: true } } },
    });
    studentId = student.id;
    waiverId = student.waivers[0].id;
  } catch (error) {
    console.error("[signup] failed to record signup", error);
    return {
      message:
        "Something went wrong saving your signup. Please try again, or call us and we will get you set up.",
    };
  }

  revalidatePath("/admin");

  // The waiver is already safely stored, so mail must not hold up the redirect or be
  // able to fail the signup. `after` runs the sends once the response is on its way.
  after(async () => {
    await sendSignupEmails({ studentId, waiverId });
  });

  redirect("/signup/thanks");
}
