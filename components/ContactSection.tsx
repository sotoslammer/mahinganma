import { site } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="px-6 py-12 md:py-18">
      <div className="mx-auto max-w-6xl">
        <h2
          id="contact-heading"
          className="text-center font-[var(--font-display)] text-4xl tracking-[0.06em] text-white md:text-5xl"
        >
          Contact
        </h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-center text-neutral-400">
          Questions about age groups, private lessons, or corporate groups? Send a note.
        </p>

        <div className="mt-10 grid items-start gap-10 md:grid-cols-[1fr_1.1fr]">
          <div>
            <h3 className="font-[var(--font-display)] text-3xl tracking-[0.05em] text-[#F52500]">Visit</h3>
            <address className="mt-4 not-italic text-neutral-400">
              {site.contact.addressLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>
            <p className="mt-4 text-neutral-400">
              <strong className="text-white">Phone:</strong> {site.contact.phone}
            </p>
            <p className="mt-2 text-neutral-400">
              <strong className="text-white">Email:</strong> {site.contact.email}
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
