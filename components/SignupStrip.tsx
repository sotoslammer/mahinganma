import { site } from "@/lib/site";

const btnPrimary =
  "inline-flex w-full items-center justify-center rounded-[7px] bg-accent px-5 py-3.5 text-sm font-medium text-white transition hover:bg-accent-hover active:scale-[0.98] md:w-auto md:px-6";

export function SignupStrip() {
  return (
    <section
      className="px-5 py-12 md:px-10 md:py-14"
      id="signup"
      aria-labelledby="signup-heading"
    >
      <div className="mx-auto max-w-[520px] text-center md:max-w-[480px]">
        <div className="rounded-[14px] border border-accent/30 bg-gradient-to-b from-[rgba(245,0,53,0.18)] to-[rgba(245,0,53,0.05)] px-5 py-6 md:px-6 md:py-6">
          <h2 id="signup-heading" className="text-[22px] font-medium tracking-[-0.02em] md:text-2xl">
            Step on the mat.
          </h2>
          <p className="mt-2 text-sm text-dim">First class is free.</p>
          <div className="mt-4">
            <a
              className={btnPrimary}
              href={site.signup.trial}
              target="_blank"
              rel="noopener noreferrer"
            >
              Start your free intro →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
