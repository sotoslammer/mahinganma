import { requireAdmin } from "@/lib/auth/admin";
import { listStudents } from "@/lib/admin/queries";

function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const waiver = url.searchParams.get("waiver");
  const rows = await listStudents({
    q: url.searchParams.get("q") ?? undefined,
    program: url.searchParams.get("program") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    waiver: ["valid", "expired", "missing", "expiring"].includes(waiver ?? "")
      ? (waiver as "valid" | "expired" | "missing" | "expiring")
      : undefined,
  });
  const header = ["first_name", "last_name", "email", "phone", "status", "programs", "waiver_expires", "payment"];
  const lines = [
    header.join(","),
    ...rows.map(({ student, programSlugs, waiver: waiverRow, subscription }) =>
      [
        csvCell(student.firstName),
        csvCell(student.lastName),
        csvCell(student.email),
        csvCell(student.phone),
        csvCell(student.status),
        csvCell(programSlugs.join("|")),
        csvCell(waiverRow?.expiresAt?.toISOString() ?? ""),
        csvCell(subscription?.status ?? ""),
      ].join(","),
    ),
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students.csv"`,
    },
  });
}
