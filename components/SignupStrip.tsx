import { site } from "@/lib/site";

const buttonPrimary =
  "inline-flex items-center justify-center rounded-md bg-[#F52500] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff4a33] active:scale-[0.98]";
const buttonOutline =
  "inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-[#F52500] hover:text-[#F52500] active:scale-[0.98]";

export function SignupStrip() {
  return (
    <section
      className="border-y border-white/10 bg-gradient-to-br from-[#F52500]/10 to-black px-6 py-12 text-center"
      id="signup"
      aria-labelledby="signup-heading"
    >
      <h2
        id="signup-heading"
        className="font-[var(--font-display)] text-4xl tracking-[0.06em] text-white md:text-5xl"
      >
        Join through our member system
      </h2>
      <p className="mx-auto mt-2 max-w-[40ch] text-neutral-400">
        Registration, waivers, and billing live in our gym management portal — use the link that matches your program.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <a className={buttonPrimary} href={site.signup.bjj} target="_blank" rel="noopener noreferrer">
          Enroll — Brazilian Jiu Jitsu
        </a>
        <a className={buttonPrimary} href={site.signup.boxing} target="_blank" rel="noopener noreferrer">
          Enroll — Boxing
        </a>
        <a className={buttonPrimary} href={site.signup.youngWarriors} target="_blank" rel="noopener noreferrer">
          Enroll — Young Warriors
        </a>
        <a className={buttonOutline} href={site.signup.trial} target="_blank" rel="noopener noreferrer">
          Trial / visitor pass
        </a>
      </div>
    </section>
  );
}
