import { site } from "@/lib/site";

const btnPrimary =
  "inline-flex items-center justify-center rounded-[7px] bg-accent px-[22px] py-[13px] text-sm font-medium text-white transition hover:bg-accent-hover active:scale-[0.98]";
const linkDim = "text-dim text-sm underline decoration-dimmer underline-offset-[3px] transition hover:text-[#eaeaea]";

function HeroImagery({ className }: { className?: string }) {
  const labelClass =
    "font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-[0.12em] text-dimmer";
  return (
    <div className={className}>
      <div className="grid h-[min(460px,52vw)] grid-rows-[2fr_1fr] gap-3 max-md:hidden">
        <div
          className="hero-placeholder flex items-end rounded-xl border border-border-subtle p-3.5"
          aria-hidden
        >
          <span className={labelClass}>Mat training</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="hero-placeholder flex min-h-[120px] items-end rounded-xl border border-border-subtle p-3.5"
            aria-hidden
          >
            <span className={labelClass}>Ring</span>
          </div>
          <div
            className="hero-placeholder flex min-h-[120px] items-end rounded-xl border border-border-subtle p-3.5"
            aria-hidden
          >
            <span className={labelClass}>Youth</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:hidden">
        <div
          className="hero-placeholder flex h-[120px] items-end rounded-xl border border-border-subtle p-3"
          aria-hidden
        >
          <span className={labelClass}>Mat</span>
        </div>
        <div
          className="hero-placeholder flex h-[120px] items-end rounded-xl border border-border-subtle p-3"
          aria-hidden
        >
          <span className={labelClass}>Ring</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const region = site.contact.addressLines[1]?.split(",")[0]?.trim() ?? "Wadena";

  return (
    <section className="relative overflow-hidden px-5 pb-10 pt-4 md:px-10 md:pb-16 md:pt-2" aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-12 md:pb-6 md:pt-10">
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-dim md:text-[11px]"
            role="status"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-bjj" aria-hidden />
            Now enrolling · {region}, SK
          </div>

          <h1
            id="hero-heading"
            className="mt-4 text-[52px] font-medium leading-none tracking-[-0.04em] md:mt-6 md:text-[76px] md:tracking-[-0.03em]"
          >
            Strength
            <br />
            through
            <br />
            <span className="text-accent">discipline.</span>
          </h1>

          <p className="mt-5 max-w-[440px] text-base leading-relaxed text-dim md:mt-7 md:text-[17px]">
            BJJ, boxing &amp; kickboxing in Wadena. Every age, every level.
          </p>

          <div className="mt-6 flex flex-col gap-3 md:mt-9 md:flex-row md:items-center md:gap-3">
            <a className={`${btnPrimary} w-full justify-center md:w-auto`} href="#signup">
              Start your free intro →
            </a>
            <span className="hidden text-[13px] text-dim md:inline">
              or{" "}
              <a href="#schedule" className={linkDim}>
                view this week&apos;s schedule
              </a>
            </span>
          </div>
          <p className="mt-3 text-center md:hidden">
            <a href="#schedule" className={`${linkDim} text-[13px]`}>
              View this week&apos;s schedule
            </a>
          </p>
        </div>

        <HeroImagery />
      </div>
    </section>
  );
}
