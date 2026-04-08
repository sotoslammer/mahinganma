const tag =
  "inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide";
const bjj = `${tag} bg-emerald-950/60 text-emerald-200`;
const boxing = `${tag} bg-red-950/50 text-red-200`;
const yw = `${tag} border border-[#F52500]/40 bg-[#F52500]/15 text-[#ffb3a8]`;

export function Schedule() {
  return (
    <section id="schedule" aria-labelledby="schedule-heading" className="px-6 py-12 md:py-18">
      <div className="mx-auto max-w-6xl">
        <h2
          id="schedule-heading"
          className="text-center font-[var(--font-display)] text-4xl tracking-[0.06em] text-white md:text-5xl"
        >
          Class schedule
        </h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-center text-neutral-400">
          Current weekly evening classes — check with the front desk for holidays or extra sessions.
        </p>

        <div className="mt-10 overflow-x-auto rounded-xl border border-white/10 bg-[#111]">
          <table className="w-full min-w-[520px] border-collapse text-[0.95rem]">
            <thead>
              <tr className="bg-neutral-950 text-[#F52500]">
                <th className="px-5 py-4 text-left font-[var(--font-display)] text-base font-normal tracking-[0.08em]">
                  Day
                </th>
                <th className="px-5 py-4 text-left font-[var(--font-display)] text-base font-normal tracking-[0.08em]">
                  Evening
                </th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              <tr className="border-t border-white/10">
                <td className="whitespace-nowrap px-5 py-4 align-top">Monday</td>
                <td className="px-5 py-4">
                  <span className={yw}>YW</span> Young Warrior Gi · 5:30–6:20
                  <br />
                  <span className={bjj}>BJJ</span> Gi · 6:30–7:30
                </td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="whitespace-nowrap px-5 py-4 align-top">Wednesday</td>
                <td className="px-5 py-4">
                  <span className={yw}>YW</span> Young Warrior No-Gi · 5:30–6:20
                  <br />
                  <span className={bjj}>BJJ</span> No-Gi · 6:30–7:30
                </td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="whitespace-nowrap px-5 py-4 align-top">Friday</td>
                <td className="px-5 py-4">
                  <span className={boxing}>Boxing</span> · 6:30–7:30
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-center text-sm text-neutral-400">
          <span className={yw}>YW</span> = Young Warriors (youth BJJ). First class? Use the sign-up links below.
        </p>
      </div>
    </section>
  );
}
