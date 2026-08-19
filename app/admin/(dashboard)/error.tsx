"use client";

/**
 * Shown when an admin Server Component throws — most often a Neon connection
 * failure after the database has been idle. Without this boundary Next.js
 * surfaces an opaque Vercel "This page couldn't load" screen.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message || "Unknown error";
  const looksLikeDb =
    /DATABASE_URL|ECONNREFUSED|P1001|P1017|Can't reach database|timeout|neon|SSL/i.test(
      message,
    );

  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center">
      <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-accent">
        Admin
      </p>
      <h1 className="mt-3 text-2xl font-medium tracking-[-0.02em]">
        {looksLikeDb ? "Database unreachable" : "Something went wrong"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-dim">
        {looksLikeDb
          ? "The app could not reach Postgres. On Neon free tier the database pauses after inactivity — open the Neon console to wake it, confirm DATABASE_URL is set for this Vercel environment, then try again."
          : "The owner area hit an unexpected error. Check the Vercel function logs for this deployment."}
      </p>
      {error.digest && (
        <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-dimmer">
          Digest {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center justify-center rounded-[7px] bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
