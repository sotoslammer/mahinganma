import { site } from "@/lib/site";

const programs = [
  {
    tag: "BJJ",
    tagClass: "bg-bjj",
    title: "Brazilian Jiu Jitsu",
    body: "Gi & no-gi. Fundamentals through advanced.",
    href: site.signup.bjj,
  },
  {
    tag: "BOX",
    tagClass: "bg-accent",
    title: "Boxing",
    body: "Footwork, defense & bag work.",
    href: site.signup.boxing,
  },
  {
    tag: "KICK",
    tagClass: "bg-accent",
    title: "Kickboxing",
    body: "Striking & conditioning in partner drills.",
    href: site.signup.boxing,
  },
  {
    tag: "YW",
    tagClass: "bg-accent",
    title: "Young Warriors",
    body: "Youth BJJ. Confidence on the mats.",
    href: site.signup.youngWarriors,
  },
] as const;

function ProgramTag({ children, className }: { children: string; className: string }) {
  return (
    <span
      className={`inline-flex min-w-7 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-white md:px-2 md:py-1 md:text-[11px] ${className}`}
    >
      {children}
    </span>
  );
}

export function Programs() {
  return (
    <section className="px-5 py-14 md:px-10 md:py-[60px]" id="programs" aria-labelledby="programs-heading">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-accent md:hidden">
              Programs
            </p>
            <h2
              id="programs-heading"
              className="mt-2 text-[30px] font-medium tracking-[-0.02em] md:mt-0 md:text-4xl"
            >
              <span className="md:hidden">Four tracks.</span>
              <span className="hidden md:inline">Programs</span>
            </h2>
            <p className="mt-2 text-sm text-dim md:hidden">Pick one or train across all.</p>
          </div>
          <p className="hidden shrink-0 text-[13px] text-dim md:block">Four tracks. Pick one or train across all.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 max-md:auto-rows-fr md:mt-8 md:grid-cols-4 md:gap-3">
          {programs.map((p) => (
            <article
              key={p.title}
              className="flex min-h-[130px] flex-col gap-2.5 rounded-xl border border-border-subtle bg-surface p-3.5 md:min-h-[200px] md:gap-3.5 md:rounded-[14px] md:p-[22px]"
            >
              <ProgramTag className={p.tagClass}>{p.tag}</ProgramTag>
              <h3 className="text-[15px] font-medium leading-tight md:text-xl">{p.title}</h3>
              <p className="flex-1 text-[12px] leading-relaxed text-dim md:text-[13px] md:leading-[1.55]">{p.body}</p>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-t border-border-subtle pt-2 text-[12px] text-[#eaeaea] no-underline transition hover:text-white md:pt-3.5 md:text-[13px]"
              >
                Learn more →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
