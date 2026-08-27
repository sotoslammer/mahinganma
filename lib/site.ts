/** Signup CTAs point at Smartwaiver (auto_tag identifies the program). Contact form posts to `/api/contact` (Resend). */
function withAutoTag(url: string, autoTag: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.get("auto_tag")) {
      parsed.searchParams.set("auto_tag", autoTag);
    }
    return parsed.toString();
  } catch {
    const join = url.includes("?") ? "&" : "?";
    return `${url}${join}auto_tag=${encodeURIComponent(autoTag)}`;
  }
}

function envWaiver(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/**
 * Build a hosted Smartwaiver URL for a program CTA.
 * Set NEXT_PUBLIC_SMARTWAIVER_TEMPLATE_ID, or a per-program override
 * (NEXT_PUBLIC_SMARTWAIVER_WAIVER_BJJ, etc.).
 */
export function smartwaiverUrl(autoTag: string): string {
  const overrideKey = `NEXT_PUBLIC_SMARTWAIVER_WAIVER_${autoTag.replace(/-/g, "_").toUpperCase()}`;
  const override = envWaiver(overrideKey);
  if (override) return withAutoTag(override, autoTag);

  const templateId = envWaiver("NEXT_PUBLIC_SMARTWAIVER_TEMPLATE_ID") ?? "YOUR_TEMPLATE_ID";
  return `https://waiver.smartwaiver.com/w/${templateId}/web/?auto_tag=${encodeURIComponent(autoTag)}`;
}

export const site = {
  /** Canonical site URL (no trailing slash) — used for metadata, sitemap, and structured data */
  url: "https://mahinganma.com",
  name: "Mahingan Martial Arts",
  mission: "Our mission is to help people improve their lives through martial arts.",
  guidingPrinciple: {
    phrase: "mino-pimowatosowin",
    /** Shown after the phrase in the guiding-principle heading (e.g. "— a good life."). */
    headlineRest: " — a good life.",
    meaning:
      "Built on showing up, doing the work, and respecting the people on the mat with you. No egos here: everyone taps, everyone resets, everyone helps the next person learn.",
    newHere:
      "Book a free intro — we'll pair you with a coach before your first class.",
  },
  values: ["Discipline", "Respect", "Consistency", "Perseverance"] as const,
  signup: {
    bjj: smartwaiverUrl("bjj"),
    boxing: smartwaiverUrl("boxing"),
    youngWarriors: smartwaiverUrl("young_warriors"),
    trial: smartwaiverUrl("trial"),
  },
  contact: {
    addressLines: ["201 1 ST NW", "Wadena, SK S0A 4J0"],
    phone: "(306) 716-1544",
    email: "info@mahinganma.com",
  },
  /** Official profile URLs — update handles/paths if yours differ */
  social: {
    instagram: "https://www.instagram.com/mahinganma",
    facebook: "https://www.facebook.com/MahinganMartialArts",
  },
} as const;
