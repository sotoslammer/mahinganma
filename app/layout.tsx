import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/JsonLd";
import { getDefaultDescription, getOrganizationJsonLd, getWebSiteJsonLd, seoKeywords } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const description = getDefaultDescription();

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Martial Arts, BJJ & Boxing | Wadena, SK`,
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
    title: `${site.name} — Martial Arts, BJJ & Boxing`,
    description,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: `${site.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Martial Arts, BJJ & Boxing`,
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
      <body className={`${fontSans.variable} ${fontMono.variable}`}>
        <JsonLd data={getOrganizationJsonLd()} />
        <JsonLd data={getWebSiteJsonLd()} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
