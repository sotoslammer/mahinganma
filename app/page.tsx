import { About } from "@/components/About";
import { ContactSection } from "@/components/ContactSection";
import { Hero } from "@/components/Hero";
import { Programs } from "@/components/Programs";
import { Schedule } from "@/components/Schedule";
import { SignupStrip } from "@/components/SignupStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <SiteHeader siteName={site.name} />
      <main id="top">
        <Hero />
        <Programs />
        <Schedule />
        <About />
        <SignupStrip />
        <ContactSection />
      </main>
      <SiteFooter siteName={site.name} />
    </>
  );
}
