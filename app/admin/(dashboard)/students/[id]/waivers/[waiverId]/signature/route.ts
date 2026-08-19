import { isSignedIn } from "@/lib/auth";
import { getWaiverWithSignature } from "@/lib/students";

export const runtime = "nodejs";

/**
 * Streams a stored signature image.
 *
 * Signatures are personal data, so they live in the database rather than public blob
 * storage and are only ever served from here, behind the owner session. Unauthenticated
 * callers get a 404 rather than a 401 so this cannot be used to confirm a waiver exists.
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

  return new Response(new Uint8Array(waiver.signatureImage), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(waiver.signatureImage.length),
      // Private and uncached: this must never be held by a CDN or shared proxy.
      "Cache-Control": "no-store, private",
      "Content-Disposition": `inline; filename="signature-${waiver.id}.png"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
