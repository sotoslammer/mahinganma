import { site } from "@/lib/site";

const buttonBase =
  "inline-flex w-full items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98]";

export function Programs() {
  return (
    <section
      className="bg-gradient-to-b from-transparent via-neutral-950/80 to-transparent px-6 py-12 md:py-18"
      id="programs"
      aria-labelledby="programs-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="programs-heading"
          className="text-center font-[var(--font-display)] text-4xl tracking-[0.06em] text-white md:text-5xl"
        >
          Programs
        </h2>
        <p className="mx-auto mt-2 max-w-[52ch] text-center text-neutral-400">
          Brazilian Jiu Jitsu (BJJ), boxing, kickboxing, and Young Warriors youth martial arts — each program has its
          own track in our member system.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111] to-[#0d1f18] p-8">
            <h3 className="font-[var(--font-display)] text-3xl tracking-[0.05em] text-white md:text-4xl">
              Brazilian Jiu Jitsu
            </h3>
            <p className="mt-3 text-neutral-400">
              Fundamentals, positional sparring, and advanced classes. Gi and no-gi sessions — check the schedule for the
              week&apos;s focus.
            </p>
            <a
              className={`${buttonBase} mt-5 bg-[#F52500] text-white hover:bg-[#ff4a33]`}
              href={site.signup.bjj}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign up for BJJ
            </a>
          </article>

          <article className="rounded-xl border border-white/10 bg-gradient-to-br from-[#111] to-[#1a0a08] p-8">
            <h3 className="font-[var(--font-display)] text-3xl tracking-[0.05em] text-white md:text-4xl">
              Boxing &amp; kickboxing
            </h3>
            <p className="mt-3 text-neutral-400">
              Boxing and kickboxing: footwork, defense, and conditioning on the bags and in partner drills. Competition
              track available for members who want to test themselves.
            </p>
            <a
              className={`${buttonBase} mt-5 bg-[#F52500] text-white hover:bg-[#ff4a33]`}
              href={site.signup.boxing}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign up for boxing
            </a>
          </article>

          <article className="rounded-xl border border-[#F52500]/30 bg-gradient-to-br from-[#111] to-[#2a0a06] p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F52500]">Youth</p>
            <h3 className="font-[var(--font-display)] text-3xl tracking-[0.05em] text-white md:text-4xl">
              Young Warriors
            </h3>
            <p className="mt-3 text-neutral-400">
              Our youth Brazilian Jiu Jitsu program — age-appropriate coaching, confidence on the mats, and a positive
              team culture rooted in our values.
            </p>
            <a
              className={`${buttonBase} mt-5 bg-[#F52500] text-white hover:bg-[#ff4a33]`}
              href={site.signup.youngWarriors}
              target="_blank"
              rel="noopener noreferrer"
            >
              Sign up for Young Warriors
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
