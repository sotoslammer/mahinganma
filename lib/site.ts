/** Signup runs in-app at `/signup`; contact form posts to `/api/contact` (Resend). */
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
  /** Internal signup routes. `?program=` preselects the program on the form. */
  signup: {
    bjj: "/signup?program=bjj",
    boxing: "/signup?program=boxing",
    youngWarriors: "/signup?program=young-warriors",
    trial: "/signup",
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
