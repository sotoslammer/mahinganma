/** Replace signup URLs with your gym management system links. Contact form posts to `/api/contact` (Resend). */
export const site = {
  /** Canonical site URL (no trailing slash) — used for metadata, sitemap, and structured data */
  url: "https://mahinganma.com",
  name: "Mahingan Martial Arts",
  mission: "Our mission is to help people improve their lives through martial arts.",
  guidingPrinciple: {
    phrase: "mino-pimowatosowin",
    meaning: "A good life through martial arts is built on discipline and consistency—showing up, putting in the work, and striving to improve every day. With respect for your coaches and teammates, and the perseverance to push through challenges, each step on the mats becomes a path to growth, confidence, and lasting character.",
  },
  values: ["Discipline", "Respect", "Consistency", "Perseverance"] as const,
  signup: {
    bjj: "https://kick.site/n2derupz",
    boxing: "https://kick.site/rzbcdwpk",
    youngWarriors: "https://kick.site/n2pownlr",
    trial: "https://kick.site/eda3bzl1",
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
