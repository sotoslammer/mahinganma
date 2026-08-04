import type { Metadata } from "next";
import { SignupForm } from "@/components/signup/SignupForm";
import { todayIso } from "@/lib/format";
import { programFromSlug } from "@/lib/validation/signup";

export const metadata: Metadata = {
  title: "Join the gym",
  description:
    "Sign up for Brazilian Jiu Jitsu, boxing or Young Warriors at Mahingan Martial Arts in Wadena, SK, and sign the training waiver online.",
  alternates: { canonical: "/signup" },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;

  return (
    <section className="px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-accent">
          Join the gym
        </p>
        <h1 className="mt-3 text-[38px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px]">
          Step on the mat.
        </h1>
        <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-dim">
          Fill this in once and you are ready for your first class. It takes about three minutes,
          and the first class is free.
        </p>

        <div className="mt-10">
          <SignupForm initialProgram={programFromSlug(program)} todayIso={todayIso()} />
        </div>
      </div>
    </section>
  );
}
