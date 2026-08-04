import { prisma } from "@/lib/db";
import { PROGRAM_VALUES, type ProgramValue } from "@/lib/validation/signup";

/**
 * Read helpers for the owner area.
 *
 * Every selection here is explicit so `Waiver.signatureImage` never rides along in a
 * list query. Those blobs are only ever loaded by the route that streams one image.
 */

export type StudentFilters = {
  q?: string;
  minor?: string;
  program?: string;
};

export type StudentListItem = Awaited<ReturnType<typeof listStudents>>["students"][number];

function normalizeProgram(value: string | undefined): ProgramValue | undefined {
  return PROGRAM_VALUES.includes(value as ProgramValue) ? (value as ProgramValue) : undefined;
}

export async function listStudents(filters: StudentFilters) {
  const q = filters.q?.trim();
  const program = normalizeProgram(filters.program);
  const minorOnly = filters.minor === "yes" ? true : filters.minor === "no" ? false : undefined;

  const where = {
    ...(minorOnly === undefined ? {} : { isMinor: minorOnly }),
    ...(program ? { program } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { guardianFirstName: { contains: q, mode: "insensitive" as const } },
            { guardianLastName: { contains: q, mode: "insensitive" as const } },
            { guardianEmail: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        isMinor: true,
        email: true,
        phone: true,
        program: true,
        guardianFirstName: true,
        guardianLastName: true,
        guardianEmail: true,
        createdAt: true,
        _count: { select: { waivers: true } },
      },
    }),
    prisma.student.count(),
  ]);

  return { students, total, filtered: students.length };
}

export async function getStudent(id: string) {
  return prisma.student.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      isMinor: true,
      email: true,
      phone: true,
      program: true,
      experience: true,
      guardianFirstName: true,
      guardianLastName: true,
      guardianRelationship: true,
      guardianEmail: true,
      guardianPhone: true,
      emergencyName: true,
      emergencyPhone: true,
      emergencyRelationship: true,
      medicalNotes: true,
      status: true,
      createdAt: true,
      waivers: {
        orderBy: { signedAt: "desc" },
        select: {
          id: true,
          version: true,
          documentTitle: true,
          signerName: true,
          signerRole: true,
          signerRelationship: true,
          signerEmail: true,
          photoConsent: true,
          signedAt: true,
          confirmationSentAt: true,
        },
      },
    },
  });
}

/** Waiver detail without the image bytes; the signature is streamed by its own route. */
export async function getWaiver(studentId: string, waiverId: string) {
  return prisma.waiver.findFirst({
    // Matching on both ids keeps a waiver from being read through another student's URL.
    where: { id: waiverId, studentId },
    select: {
      id: true,
      studentId: true,
      version: true,
      documentTitle: true,
      documentText: true,
      signerName: true,
      signerRole: true,
      signerRelationship: true,
      signerEmail: true,
      photoConsent: true,
      signatureWidth: true,
      signatureHeight: true,
      signedAt: true,
      confirmationSentAt: true,
      ipAddress: true,
      userAgent: true,
      student: {
        select: { id: true, firstName: true, lastName: true, dateOfBirth: true, isMinor: true },
      },
    },
  });
}

/** Full record including image bytes, for the signature and PDF routes only. */
export async function getWaiverWithSignature(studentId: string, waiverId: string) {
  return prisma.waiver.findFirst({
    where: { id: waiverId, studentId },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
      },
    },
  });
}
