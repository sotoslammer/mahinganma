import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Students", template: `%s | ${site.name} admin` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The proxy already gates /admin/*, but a layout check is cheap and this area must
  // never render without one. Each page below verifies for itself as well.
  await requireAdmin();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-[#050505]/85 px-5 py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-baseline gap-3">
            <Link href="/admin" className="truncate text-[15px] font-medium text-[#eaeaea]">
              {site.name}
            </Link>
            <span className="font-[family-name:var(--font-mono)] shrink-0 text-[10px] uppercase tracking-[0.12em] text-accent">
              Admin
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-5 text-[13px]">
            <Link className="text-dim transition hover:text-[#eaeaea]" href="/">
              View site
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-dim underline decoration-dimmer underline-offset-[3px] transition hover:text-[#eaeaea]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="px-5 py-8 md:px-8 md:py-10">{children}</main>
    </>
  );
}
