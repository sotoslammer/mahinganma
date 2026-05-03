import { ContactForm } from "./ContactForm";

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="px-5 py-14 md:px-10 md:py-[60px]">
      <div className="mx-auto max-w-[1200px]">
        <h2
          id="contact-heading"
          className="text-center text-3xl font-medium tracking-[-0.02em] md:text-4xl"
        >
          Contact
        </h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-center text-sm text-dim">
          Questions about age groups, private lessons, or corporate groups? Send a note.
        </p>

        <div className="mx-auto mt-10 max-w-xl">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
