export const PROGRAMS = [
  {
    slug: "bjj",
    name: "Brazilian Jiu Jitsu",
    autoTag: "bjj",
    stripePriceEnv: "STRIPE_PRICE_BJJ",
  },
  {
    slug: "boxing",
    name: "Boxing",
    autoTag: "boxing",
    stripePriceEnv: "STRIPE_PRICE_BOXING",
  },
  {
    slug: "young-warriors",
    name: "Young Warriors",
    autoTag: "young_warriors",
    stripePriceEnv: "STRIPE_PRICE_YOUNG_WARRIORS",
  },
  {
    slug: "trial",
    name: "Free intro",
    autoTag: "trial",
    stripePriceEnv: "STRIPE_PRICE_TRIAL",
  },
] as const;

export type ProgramSlug = (typeof PROGRAMS)[number]["slug"];

export function programByAutoTag(autoTag: string | null | undefined) {
  if (!autoTag) return undefined;
  const normalized = autoTag.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return PROGRAMS.find((program) => program.autoTag === normalized);
}

export function stripePriceIdForSlug(slug: string): string | undefined {
  const program = PROGRAMS.find((item) => item.slug === slug);
  if (!program) return undefined;
  const value = process.env[program.stripePriceEnv]?.trim();
  return value || undefined;
}
