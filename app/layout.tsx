import type { Metadata } from "next";
import { Bebas_Neue, Source_Sans_3 } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { getDefaultDescription, getOrganizationJsonLd, getWebSiteJsonLd, seoKeywords } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const fontDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const fontBody = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

const description = getDefaultDescription();

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Martial Arts, BJJ, Boxing & Kickboxing | Wadena, SK`,
    template: `%s | ${site.name}`,
  },
  description,
  keywords: [...seoKeywords],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Martial Arts, BJJ, Boxing & Kickboxing`,
    description,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: `${site.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Martial Arts, BJJ, Boxing & Kickboxing`,
    description,
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <body className={`${fontDisplay.variable} ${fontBody.variable}`}>
        <JsonLd data={getOrganizationJsonLd()} />
        <JsonLd data={getWebSiteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
