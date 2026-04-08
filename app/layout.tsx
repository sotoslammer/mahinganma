import type { Metadata } from "next";
import { Bebas_Neue, Source_Sans_3 } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Mahingan Martial Arts — BJJ & Boxing",
  description:
    "Mahingan Martial Arts: Brazilian Jiu Jitsu, boxing, and Young Warriors youth BJJ. Improve lives through martial arts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontDisplay.variable} ${fontBody.variable}`}>{children}</body>
    </html>
  );
}
