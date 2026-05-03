import { site } from "@/lib/site";

export function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="px-5 pb-14 pt-10 md:px-10 md:pb-[60px] md:pt-[60px]">
      <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-accent">
            Guiding principle
          </p>
          <h2
            id="about-heading"
            className="mt-3 text-[26px] font-medium leading-snug tracking-[-0.02em] md:text-[34px]"
          >
            <span className="text-accent">{site.guidingPrinciple.phrase}</span>
            {site.guidingPrinciple.headlineRest}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-dim md:mt-[18px] md:max-w-[520px] md:text-base">{site.guidingPrinciple.meaning}</p>
          <p className="mt-4 text-sm leading-relaxed text-[#eaeaea] md:mt-[22px] md:max-w-[520px] md:text-[15px]">
            <strong>New here?</strong> {site.guidingPrinciple.newHere}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex md:flex-col md:gap-2.5">
          {site.values.map((v, i) => (
            <div
              key={v}
              className="flex items-center gap-2.5 rounded-[10px] border border-border-subtle bg-surface px-3.5 py-3 md:gap-5 md:px-5 md:py-4"
            >
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-dimmer md:text-[11px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[14px] font-medium md:text-[17px]">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
