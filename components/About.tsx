import { site } from "@/lib/site";

export function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="px-6 py-12 md:py-18">
      <div className="mx-auto max-w-6xl">
        <h2
          id="about-heading"
          className="text-center font-[var(--font-display)] text-4xl tracking-[0.06em] text-white md:text-5xl"
        >
          About us
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-neutral-300">{site.mission}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-[#111] p-7 shadow-2xl lg:col-span-3">
            <h3 className="font-[var(--font-display)] text-2xl tracking-[0.05em] text-[#F52500]">
              Guiding principle
            </h3>
            <p className="mt-3 text-neutral-400">
              <span className="font-semibold text-white">{site.guidingPrinciple.phrase}</span>
              {" — "}
              {site.guidingPrinciple.meaning}
            </p>
          </article>

          <article className="rounded-xl border border-white/10 bg-[#111] p-7 shadow-2xl">
            <h3 className="font-[var(--font-display)] text-3xl tracking-[0.05em] text-[#F52500]">Our values</h3>
            <ul className="mt-4 space-y-2 text-neutral-400">
              {site.values.map((v) => (
                <li key={v} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F52500]" aria-hidden />
                  {v}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-white/10 bg-[#111] p-7 shadow-2xl lg:col-span-2">
            <h3 className="font-[var(--font-display)] text-3xl tracking-[0.05em] text-[#F52500]">Training</h3>
            <p className="mt-4 text-neutral-400">
              Technique first — whether you are learning your first armbar or sharpening your jab. Our coaches break
              skills into steps you can repeat, then pressure-test them safely with partners who match your level.
            </p>
            <p className="mt-4 text-neutral-400">
              You will find no egos here: everyone taps, everyone resets, and everyone helps the next person learn.
            </p>
            <p className="mt-4 text-neutral-400">
              <strong className="text-white">New?</strong> Start with a fundamentals class — we will pair you with a
              coach intro before you step on the mat or in the ring.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
