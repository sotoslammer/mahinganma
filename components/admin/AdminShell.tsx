import Link from "next/link";
import { site } from "@/lib/site";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/messages", label: "Messages" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#eaeaea]">
      <header className="border-b border-border-subtle bg-[#050505]/90 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-accent">
              Admin
            </p>
            <p className="truncate text-sm font-medium">{site.name}</p>
          </div>
          <nav className="hidden items-center gap-5 text-[13px] text-dim md:flex" aria-label="Admin">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-[#eaeaea]">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-[12px] text-dim">
            <span className="hidden truncate sm:inline">{email}</span>
            <form action="/admin/sign-out" method="post">
              <button type="submit" className="underline decoration-dimmer underline-offset-2 hover:text-[#eaeaea]">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto mt-3 flex max-w-[1200px] gap-4 overflow-x-auto text-[13px] text-dim md:hidden" aria-label="Admin mobile">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-[#eaeaea]">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
