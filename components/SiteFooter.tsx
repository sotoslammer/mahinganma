import Image from "next/image";
import { SocialLinks } from "@/components/SocialLinks";
import { site } from "@/lib/site";

export function SiteFooter({ siteName }: { siteName: string }) {
  const year = new Date().getFullYear();
  const telHref = site.contact.phone.replace(/\D/g, "");
  return (
    <footer className="border-t border-border-subtle bg-[#050505] px-6 py-8 text-center text-sm text-dimmer">
      <div className="flex justify-center">
        <Image
          src="/logo.png"
          alt={`${siteName} logo`}
          width={80}
          height={80}
          className="h-16 w-16 object-contain sm:h-20 sm:w-20"
        />
      </div>
      <SocialLinks siteName={siteName} />

      <address className="mx-auto mt-6 max-w-md not-italic leading-relaxed">
        {site.contact.addressLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>

      <p className="mt-4">
        <a className="transition hover:text-accent" href={`tel:${telHref}`}>
          {site.contact.phone}
        </a>
      </p>
      <p className="mt-1">
        <a className="transition hover:text-accent" href={`mailto:${site.contact.email}`}>
          {site.contact.email}
        </a>
      </p>

      <p className="mt-6">
        © {year} {siteName} ·{" "}
        <a className="transition hover:text-accent" href="#top">
          Back to top
        </a>
      </p>
    </footer>
  );
}
