import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/lib/site";

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  const [first, ...rest] = site.name.trim().split(/\s+/);
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-[#050505]/85 px-5 py-4 backdrop-blur-md md:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <Link
            className="flex min-w-0 items-center gap-2.5 text-[16px] font-medium text-[#eaeaea] md:text-[18px]"
            href="/"
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
              {first}
              {rest.length > 0 ? <span className="text-accent"> {rest.join(" ")}</span> : null}
            </span>
          </Link>
          <Link className="text-[13px] text-dim transition hover:text-[#eaeaea]" href="/">
            ← Back to site
          </Link>
        </div>
      </header>
      {/* The footer's "back to top" link targets #top. */}
      <main id="top">{children}</main>
      <SiteFooter siteName={site.name} />
    </>
  );
}
