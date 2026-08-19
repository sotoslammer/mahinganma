import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "You're signed up",
  // Nothing to index here, and it should never surface as a search result.
  robots: { index: false, follow: false },
};

export default function SignupThanksPage() {
  const telHref = site.contact.phone.replace(/\D/g, "");

  return (
    <section className="px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
          <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-[34px] font-medium leading-tight tracking-[-0.03em] md:text-[44px]">
          You&apos;re signed up.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-dim">
          Your waiver is signed and on file. We have emailed you a copy for your records, and a
          coach will be in touch to get you into your first class.
        </p>
        <p className="mt-4 text-sm text-dimmer">
          Nothing in your inbox after a few minutes? Check your spam folder, or call us at{" "}
          <a className="underline underline-offset-[3px] transition hover:text-accent" href={`tel:${telHref}`}>
            {site.contact.phone}
          </a>
          .
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 md:flex-row md:justify-center">
          <Link
            href="/#schedule"
            className="inline-flex w-full items-center justify-center rounded-[7px] bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-hover active:scale-[0.98] md:w-auto"
          >
            See the class schedule →
          </Link>
          <Link className="text-sm text-dim underline decoration-dimmer underline-offset-[3px] transition hover:text-[#eaeaea]" href="/">
            Back to the homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
