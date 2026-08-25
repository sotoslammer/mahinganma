import Link from "next/link";
import { listPendingReviews } from "@/lib/admin/queries";
import { getDb } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { cardClass, btnGhost, btnPrimary } from "@/components/admin/ui";
import { studentName } from "@/lib/format";
import { createFromReview, ignoreReview, mergeReview } from "./actions";

export default async function ReviewsPage() {
  const reviews = await listPendingReviews();
  const candidateIds = [...new Set(reviews.flatMap((row) => row.candidateStudentIds ?? []))];
  const db = getDb();
  const candidates = db && candidateIds.length
    ? await db.select().from(students).where(inArray(students.id, candidateIds))
    : [];
  const byId = new Map(candidates.map((row) => [row.id, row]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-[-0.02em]">Identity reviews</h1>
        <p className="mt-1 text-sm text-dim">
          Ambiguous Smartwaiver matches wait here instead of merging two people automatically.
        </p>
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-dim">No pending reviews.</p>
      ) : (
        reviews.map((review) => {
          const snapshot = review.snapshot as {
            firstName?: string;
            lastName?: string;
            email?: string | null;
            dob?: string | null;
          };
          return (
            <section key={review.id} className={cardClass}>
              <p className="text-sm text-dim">Reason: {review.reason.replaceAll("_", " ")}</p>
              <h2 className="mt-1 text-xl font-medium">
                {snapshot.firstName} {snapshot.lastName}
              </h2>
              <p className="text-sm text-dim">
                {snapshot.email || "No email"} · DOB {snapshot.dob || "unknown"} · waiver {review.smartwaiverId}
              </p>
              <div className="mt-4 space-y-2">
                {(review.candidateStudentIds ?? []).map((id) => {
                  const candidate = byId.get(id);
                  return (
                    <form key={id} action={mergeReview} className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-3 py-2">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="studentId" value={id} />
                      <span className="text-sm">
                        {candidate ? (
                          <Link href={`/admin/students/${id}`} className="hover:text-white">
                            {studentName(candidate.firstName, candidate.lastName)}
                          </Link>
                        ) : (
                          id
                        )}
                        {candidate?.email ? <span className="text-dim"> · {candidate.email}</span> : null}
                      </span>
                      <button className={btnPrimary} type="submit">
                        Merge into this student
                      </button>
                    </form>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <form action={createFromReview}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button className={btnGhost} type="submit">
                    Create new student
                  </button>
                </form>
                <form action={ignoreReview}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button className={btnGhost} type="submit">
                    Ignore
                  </button>
                </form>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
