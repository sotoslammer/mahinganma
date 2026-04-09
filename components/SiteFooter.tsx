import { SocialLinks } from "@/components/SocialLinks";
import { site } from "@/lib/site";

export function SiteFooter({ siteName }: { siteName: string }) {
  const year = new Date().getFullYear();
  const telHref = site.contact.phone.replace(/\D/g, "");
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-8 text-center text-sm text-neutral-500">
      <SocialLinks siteName={siteName} />

      <address className="mx-auto mt-6 max-w-md not-italic leading-relaxed">
        {site.contact.addressLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>

      <p className="mt-4">
        <a className="transition hover:text-[#F52500]" href={`tel:${telHref}`}>
          {site.contact.phone}
        </a>
      </p>
      <p className="mt-1">
        <a className="transition hover:text-[#F52500]" href={`mailto:${site.contact.email}`}>
          {site.contact.email}
        </a>
      </p>

      <p className="mt-6">
        © {year} {siteName} ·{" "}
        <a className="transition hover:text-[#F52500]" href="#top">
          Back to top
        </a>
      </p>
    </footer>
  );
}
