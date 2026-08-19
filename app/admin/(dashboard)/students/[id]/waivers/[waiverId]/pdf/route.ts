import { isSignedIn } from "@/lib/auth";
import { getWaiverWithSignature } from "@/lib/students";
import { renderWaiverPdf, waiverFileName } from "@/lib/waiver-pdf";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Builds the signed waiver as a PDF on demand.
 *
 * Generated from the stored snapshot by the same function that produces the copy
 * emailed at signup, so the owner's file and the signer's file always agree.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; waiverId: string }> },
) {
  if (!(await isSignedIn())) {
    return new Response("Not found", { status: 404 });
  }

  const { id, waiverId } = await params;
  const waiver = await getWaiverWithSignature(id, waiverId);
  if (!waiver) {
    return new Response("Not found", { status: 404 });
  }

  const pdf = await renderWaiverPdf({
    student: waiver.student,
    waiver: { ...waiver, signerRole: waiver.signerRole as "SELF" | "PARENT_GUARDIAN" },
    organizationName: site.name,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store, private",
      "Content-Disposition": `inline; filename="${waiverFileName(waiver.student, waiver.signedAt)}"`,
    },
  });
}
