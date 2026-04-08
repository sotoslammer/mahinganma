"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const navLinks = [
  { href: "#about", label: "About" },
  { href: "#programs", label: "Programs" },
  { href: "#schedule", label: "Schedule" },
  { href: "#signup", label: "Sign up" },
  { href: "#contact", label: "Contact" },
];

const linkBase =
  "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98]";

export function SiteHeader({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const parts = siteName.trim().split(/\s+/);
  const logoFirst = parts[0] ?? siteName;
  const logoRest = parts.slice(1).join(" ");

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (headerRef.current && !headerRef.current.contains(t)) close();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, close]);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <a className="font-[var(--font-display)] text-3xl tracking-[0.06em] text-white" href="#top">
            {logoFirst}
            {logoRest ? <span className="text-[#F52500]"> {logoRest}</span> : null}
          </a>

          <button
            type="button"
            className="rounded-md border border-white/15 px-3 py-2 text-sm text-neutral-200 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            Menu
          </button>

          <nav className="hidden md:block" aria-label="Primary">
            <ul className="flex items-center gap-7">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a className="text-neutral-400 transition hover:text-white" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {open ? <div className="fixed inset-0 z-40 bg-black/60 md:hidden" /> : null}
      <nav
        aria-label="Mobile"
        className={`fixed right-0 top-0 z-50 h-screen w-[min(280px,85vw)] border-l border-white/10 bg-[#111] p-6 pt-20 shadow-2xl transition-transform md:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <ul className="flex flex-col gap-5">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a className="text-neutral-400 transition hover:text-white" href={l.href} onClick={close}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              className={`${linkBase} w-full bg-[#F52500] text-white hover:bg-[#ff4a33]`}
              href="#signup"
              onClick={close}
            >
              Enroll
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
