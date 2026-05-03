import { site } from "@/lib/site";

/** Target phrases for metadata and on-page copy (avoid stuffing; use naturally). */
export const seoKeywords = [
  "martial arts",
  "brazilian jiu jitsu",
  "bjj",
  "boxing",
  "Wadena",
  "Saskatchewan",
] as const;

const defaultDescription =
  "Mahingan Martial Arts in Wadena, SK offers Brazilian Jiu Jitsu (BJJ), boxing, and Young Warriors youth BJJ. Improve your life through disciplined training.";

export function getDefaultDescription(): string {
  return defaultDescription;
}

function parseAddressLine2(line: string): {
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
} {
  const m = line.match(/^(.+?),\s*([A-Z]{2})\s+(.+)$/);
  if (m) {
    return {
      addressLocality: m[1].trim(),
      addressRegion: m[2],
      postalCode: m[3].trim(),
    };
  }
  return { addressLocality: line, addressRegion: "", postalCode: "" };
}

export function getOrganizationJsonLd() {
  const [streetAddress, line2] = site.contact.addressLines;
  const { addressLocality, addressRegion, postalCode } = parseAddressLine2(line2);

  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: site.name,
    description: defaultDescription,
    url: site.url,
    telephone: site.contact.phone,
    email: site.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality,
      addressRegion,
      postalCode,
      addressCountry: "CA",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Saskatchewan",
    },
    knowsAbout: ["Martial arts", "Brazilian Jiu Jitsu", "BJJ", "Boxing"],
    sameAs: [site.social.instagram, site.social.facebook],
  };
}

export function getWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: defaultDescription,
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };
}
