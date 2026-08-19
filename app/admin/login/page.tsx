import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Owner sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-accent">
          {site.name}
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.02em]">Owner sign in</h1>
        <p className="mt-2 text-sm text-dim">
          Student records and signed waivers live behind this page.
        </p>

        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
