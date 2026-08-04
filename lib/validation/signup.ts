import { z } from "zod";
import { AGE_OF_MAJORITY } from "@/lib/waiver";

/**
 * Shared by the signup form and the Server Action that receives it. Kept isomorphic
 * (no Node built-ins) so the browser can reuse the same rules, but the client copy is
 * only a convenience: the action re-parses and re-derives everything from scratch.
 */

export const PROGRAM_VALUES = ["BJJ", "BOXING", "YOUNG_WARRIORS", "UNDECIDED"] as const;
export type ProgramValue = (typeof PROGRAM_VALUES)[number];

export const PROGRAM_LABELS: Record<ProgramValue, string> = {
  BJJ: "Brazilian Jiu Jitsu",
  BOXING: "Boxing",
  YOUNG_WARRIORS: "Young Warriors (youth BJJ)",
  UNDECIDED: "Not sure yet",
};

/** Maps the `?program=` values used by the landing page CTAs onto enum members. */
export function programFromSlug(slug: string | undefined): ProgramValue {
  switch (slug?.toLowerCase()) {
    case "bjj":
      return "BJJ";
    case "boxing":
      return "BOXING";
    case "young-warriors":
    case "youngwarriors":
      return "YOUNG_WARRIORS";
    default:
      return "UNDECIDED";
  }
}

/** Parses a `YYYY-MM-DD` form value into the midnight-UTC instant used for date columns. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects overflow like 2026-02-31, which Date.UTC would silently roll forward.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

/** Completed years between two dates, compared in UTC to match date-only storage. */
export function ageOn(dateOfBirth: Date, on: Date): number {
  let age = on.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDelta = on.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && on.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function isMinorOn(dateOfBirth: Date, on: Date): boolean {
  return ageOn(dateOfBirth, on) < AGE_OF_MAJORITY;
}

// --- Drawn signature ------------------------------------------------------

const SIGNATURE_PREFIX = "data:image/png;base64,";
/** Comfortably above an accidental empty submission, well below anything a pad produces. */
const SIGNATURE_MIN_BYTES = 512;
const SIGNATURE_MAX_BYTES = 250_000;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export type SignatureDecodeResult =
  | { ok: true; bytes: Uint8Array<ArrayBuffer>; width: number; height: number }
  | { ok: false; error: string };

/**
 * Validates and decodes the data URL produced by the signature pad.
 *
 * The pad writes into a hidden input, so nothing here can be trusted. This checks the
 * PNG container itself rather than just the declared MIME type, and reads the real
 * pixel dimensions out of the IHDR chunk instead of believing the submitted numbers.
 */
export function decodeSignature(value: unknown): SignatureDecodeResult {
  if (typeof value !== "string" || !value.startsWith(SIGNATURE_PREFIX)) {
    return { ok: false, error: "Please draw your signature in the box." };
  }

  let bytes: Uint8Array<ArrayBuffer>;
  try {
    const binary = atob(value.slice(SIGNATURE_PREFIX.length));
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return { ok: false, error: "That signature could not be read. Please draw it again." };
  }

  if (bytes.length < SIGNATURE_MIN_BYTES || bytes.length > SIGNATURE_MAX_BYTES) {
    return { ok: false, error: "That signature could not be read. Please draw it again." };
  }
  if (PNG_MAGIC.some((byte, i) => bytes[i] !== byte)) {
    return { ok: false, error: "That signature could not be read. Please draw it again." };
  }

  // IHDR is required to be the first chunk: 4-byte length, "IHDR", then width and height.
  const isIhdr = ["I", "H", "D", "R"].every((char, i) => bytes[12 + i] === char.charCodeAt(0));
  if (!isIhdr) {
    return { ok: false, error: "That signature could not be read. Please draw it again." };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width < 32 || width > 4000 || height < 16 || height > 2000) {
    return { ok: false, error: "That signature could not be read. Please draw it again." };
  }

  return { ok: true, bytes, width, height };
}

// --- Form schema ----------------------------------------------------------

const trimmed = (max: number) => z.string().trim().max(max);
const required = (max: number, message: string) => trimmed(max).min(1, message);
const optional = (max: number) =>
  z
    .unknown()
    .transform((v) => (typeof v === "string" ? v.trim() : ""))
    .pipe(z.string().max(max));
const optionalEmail = (message: string) =>
  optional(320).refine((v) => v === "" || z.email().safeParse(v).success, message);
const checkbox = z.unknown().transform((v) => v === "on" || v === "true" || v === true);

export const signupSchema = z
  .object({
    firstName: required(100, "Student first name is required."),
    lastName: required(100, "Student last name is required."),
    dateOfBirth: required(10, "Date of birth is required."),
    email: optionalEmail("Enter a valid student email address."),
    phone: optional(40),
    program: z.enum(PROGRAM_VALUES).catch("UNDECIDED"),
    experience: optional(2000),

    guardianFirstName: optional(100),
    guardianLastName: optional(100),
    guardianRelationship: optional(100),
    guardianEmail: optionalEmail("Enter a valid parent or guardian email address."),
    guardianPhone: optional(40),

    emergencyName: required(200, "An emergency contact name is required."),
    emergencyPhone: required(40, "An emergency contact phone number is required."),
    emergencyRelationship: optional(100),
    medicalNotes: optional(5000),

    signerName: required(200, "Please type the name of the person signing."),
    photoConsent: checkbox,
    agreeWaiver: checkbox,
    signatureData: z.unknown(),

    website: optional(200),
  })
  .superRefine((data, ctx) => {
    const dob = parseIsoDate(data.dateOfBirth);
    if (!dob) {
      ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Enter a valid date of birth." });
      return;
    }

    const today = new Date();
    if (dob.getTime() > today.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "Date of birth cannot be in the future.",
      });
      return;
    }
    if (ageOn(dob, today) > 120) {
      ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "Enter a valid date of birth." });
      return;
    }

    if (isMinorOn(dob, today)) {
      // A minor cannot sign for themselves, so the guardian block becomes mandatory.
      const guardianFields = [
        ["guardianFirstName", "Parent or guardian first name is required."],
        ["guardianLastName", "Parent or guardian last name is required."],
        ["guardianRelationship", "Tell us your relationship to the student."],
        ["guardianEmail", "A parent or guardian email address is required."],
        ["guardianPhone", "A parent or guardian phone number is required."],
      ] as const;
      for (const [field, message] of guardianFields) {
        if (!data[field]) ctx.addIssue({ code: "custom", path: [field], message });
      }
    } else if (!data.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "An email address is required." });
    }

    if (!data.agreeWaiver) {
      ctx.addIssue({
        code: "custom",
        path: ["agreeWaiver"],
        message: "Please confirm you have read and agree to the waiver.",
      });
    }

    const signature = decodeSignature(data.signatureData);
    if (!signature.ok) {
      ctx.addIssue({ code: "custom", path: ["signatureData"], message: signature.error });
    }
  });

export type SignupInput = z.infer<typeof signupSchema>;

/** Field names the form posts, used to rebuild the payload from FormData. */
export const SIGNUP_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "email",
  "phone",
  "program",
  "experience",
  "guardianFirstName",
  "guardianLastName",
  "guardianRelationship",
  "guardianEmail",
  "guardianPhone",
  "emergencyName",
  "emergencyPhone",
  "emergencyRelationship",
  "medicalNotes",
  "signerName",
  "photoConsent",
  "agreeWaiver",
  "signatureData",
  "website",
] as const;
