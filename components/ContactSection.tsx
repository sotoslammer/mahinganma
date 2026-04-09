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

        <div className="mx-auto mt-10 max-w-xl">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
