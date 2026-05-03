"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
const navLinks = [
  { href: "#programs", label: "Programs" },
  { href: "#schedule", label: "Schedule" },
  { href: "#about", label: "About" },
];

const navMobileExtra = [{ href: "#contact", label: "Contact" }];

const btnPrimarySm =
  "inline-flex items-center justify-center rounded-[7px] bg-accent px-3.5 py-[7px] text-xs font-medium text-white transition hover:bg-accent-hover active:scale-[0.98]";

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
        className="sticky top-0 z-50 border-b border-border-subtle bg-[#050505]/85 px-5 py-4 backdrop-blur-md md:px-10"
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <a
            className="flex min-w-0 items-center gap-2.5 text-[16px] font-medium text-[#eaeaea] md:gap-2.5 md:text-[18px]"
            href="#top"
          >
            <Image
              src="/logo.png"
              alt=""
              width={48}
              height={48}
              className="h-7 w-7 shrink-0 object-contain md:h-[26px] md:w-[26px]"
              priority
            />
            <span className="truncate">
              {logoFirst}
              {logoRest ? <span className="text-accent"> {logoRest}</span> : null}
            </span>
          </a>

          <button
            type="button"
            className="flex h-[38px] w-[38px] flex-col items-center justify-center gap-1 rounded-lg border border-border-subtle md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="h-0.5 w-4 bg-[#eaeaea]" />
            <span className="h-0.5 w-4 bg-[#eaeaea]" />
          </button>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            <ul className="flex items-center gap-7 text-[13px] text-dim">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a className="transition hover:text-[#eaeaea]" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <a className={btnPrimarySm} href="#signup">
              Start free intro
            </a>
          </nav>
        </div>
      </header>

      {open ? <div className="fixed inset-0 z-40 bg-black/60 md:hidden" /> : null}
      <nav
        aria-label="Mobile"
        className={`fixed right-0 top-0 z-50 h-screen w-[min(280px,85vw)] border-l border-border-subtle bg-[#0a0a0a] p-6 pt-24 shadow-2xl transition-transform md:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <ul className="flex flex-col gap-5 text-dim">
          {[...navLinks, ...navMobileExtra].map((l) => (
            <li key={l.href}>
              <a className="text-[15px] transition hover:text-[#eaeaea]" href={l.href} onClick={close}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a className={`${btnPrimarySm} w-full py-3 text-sm`} href="#signup" onClick={close}>
              Start free intro →
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
