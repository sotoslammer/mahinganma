type Slot = { tag: string; name: string; time: string; tagClass: string };

const rows: { abbr: string; day: string; slots: Slot[] }[] = [
  {
    abbr: "MON",
    day: "Monday",
    slots: [
      { tag: "YW", name: "Young Warrior Gi", time: "5:30 PM", tagClass: "bg-accent" },
      { tag: "BJJ", name: "Gi", time: "6:30 PM", tagClass: "bg-bjj" },
    ],
  },
  {
    abbr: "WED",
    day: "Wednesday",
    slots: [
      { tag: "YW", name: "Young Warrior No-Gi", time: "5:30 PM", tagClass: "bg-accent" },
      { tag: "BJJ", name: "No-Gi", time: "6:30 PM", tagClass: "bg-bjj" },
    ],
  },
  {
    abbr: "FRI",
    day: "Friday",
    slots: [{ tag: "BOX", name: "Boxing", time: "6:30 PM", tagClass: "bg-accent" }],
  },
];

function Tag({ children, className }: { children: string; className: string }) {
  return (
    <span
      className={`inline-flex min-w-7 shrink-0 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-white ${className}`}
    >
      {children}
    </span>
  );
}

export function Schedule() {
  return (
    <section id="schedule" aria-labelledby="schedule-heading" className="px-5 pb-14 md:px-10 md:pb-[60px]">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-accent md:hidden">
              This week
            </p>
            <h2
              id="schedule-heading"
              className="mt-2 text-[30px] font-medium tracking-[-0.02em] md:mt-0 md:text-4xl"
            >
              <span className="md:hidden">Evening classes.</span>
              <span className="hidden md:inline">This week</span>
            </h2>
          </div>
          <p className="font-[family-name:var(--font-mono)] hidden shrink-0 text-[13px] text-dim md:block">evenings</p>
        </div>

        {/* Mobile: card per day */}
        <div className="mt-5 flex flex-col gap-2.5 md:hidden">
          {rows.map((r) => (
            <div
              key={r.day}
              className="grid grid-cols-[56px_1fr] gap-3 rounded-xl border border-border-subtle bg-surface p-3.5"
            >
              <div>
                <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.08em] text-dimmer">
                  {r.abbr}
                </div>
                <div className="mt-0.5 text-[15px] font-medium">{r.day}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                {r.slots.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <Tag className={s.tagClass}>{s.tag}</Tag>
                    <span className="flex-1 text-[13px]">{s.name}</span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-dim">
                      {s.time.replace(/\s*PM$/i, "").toLowerCase()}p
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: bordered list */}
        <div className="mt-6 hidden overflow-hidden rounded-[14px] border border-border-subtle bg-surface md:block">
          {rows.map((r, i) => (
            <div
              key={r.day}
              className={`grid grid-cols-[120px_1fr] items-center gap-6 px-6 py-[18px] ${i > 0 ? "border-t border-border-subtle" : ""}`}
            >
              <div>
                <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.08em] text-dimmer">
                  {r.abbr}
                </div>
                <div className="mt-0.5 text-lg font-medium">{r.day}</div>
              </div>
              <div className="flex flex-wrap gap-6">
                {r.slots.map((s) => (
                  <div key={s.name} className="flex items-center gap-2.5">
                    <Tag className={s.tagClass}>{s.tag}</Tag>
                    <span className="text-sm">{s.name}</span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-dim">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-right text-xs text-dimmer md:mt-3.5">
          Classes are 60–90 min. Holidays &amp; extra sessions at the front desk.
        </p>
      </div>
    </section>
  );
}
