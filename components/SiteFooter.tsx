export function SiteFooter({ siteName }: { siteName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-8 text-center text-sm text-neutral-500">
      <p>
        © {year} {siteName} ·{" "}
        <a className="transition hover:text-[#F52500]" href="#top">
          Back to top
        </a>
      </p>
    </footer>
  );
}
