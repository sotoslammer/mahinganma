/** Replace signup URLs with your gym management system links and Formspree (or other) form endpoint. */
export const site = {
  name: "Mahingan Martial Arts",
  mission: "Our mission is to help people improve their lives through martial arts.",
  guidingPrinciple: {
    phrase: "mino-pimowatosowin",
    meaning: "Living a good life — our guiding principle.",
  },
  values: ["Discipline", "Dedication", "Consistency", "Perseverance"] as const,
  signup: {
    bjj: "https://kick.site/n2derupz",
    boxing: "https://kick.site/rzbcdwpk",
    youngWarriors: "https://kick.site/n2pownlr",
    trial: "https://kick.site/eda3bzl1",
  },
  /** Formspree: https://formspree.io — replace YOUR_FORM_ID */
  contactFormAction: "https://formspree.io/f/YOUR_FORM_ID",
  contact: {
    addressLines: ["201 1 ST NW", "Wadena, SK S0A 4J0"],
    phone: "(306) 716-1544",
    email: "info@mahinganma.com",
  },
} as const;
