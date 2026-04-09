const buttonBase =
  "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98]";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden px-6 py-16 text-center md:py-24"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#000_100%)]" />
      <div className="relative mx-auto max-w-3xl">
        <h1
          id="hero-heading"
          className="font-[var(--font-display)] text-5xl leading-none tracking-[0.04em] text-white md:text-7xl"
        >
          Strength through discipline
        </h1>
        <p className="mx-auto mt-4 max-w-[44ch] text-lg text-neutral-400">
          Martial arts in Wadena: Brazilian Jiu Jitsu (BJJ), boxing, and kickboxing — structured classes for every age
          and level.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            className={`${buttonBase} bg-[#F52500] text-white hover:bg-[#ff4a33]`}
            href="#signup"
          >
            Enroll in a class
          </a>
          <a
            className={`${buttonBase} border border-white/15 text-neutral-200 hover:border-[#F52500] hover:text-[#F52500]`}
            href="#schedule"
          >
            View schedule
          </a>
        </div>
      </div>
    </section>
  );
}
