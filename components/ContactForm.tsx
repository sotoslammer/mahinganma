"use client";

import { FormEvent, useState } from "react";
import { site } from "@/lib/site";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error" | "config">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const action = site.contactFormAction;
    if (action.includes("YOUR_FORM_ID")) {
      setStatus("config");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch(action, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-neutral-200 outline-none transition focus:border-[#F52500]";

  return (
    <form className="rounded-xl border border-white/10 bg-[#111] p-7" onSubmit={onSubmit}>
      <div className="mb-4">
        <label className="mb-1 block text-sm font-semibold text-neutral-400" htmlFor="name">
          Name
        </label>
        <input className={inputClass} id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-semibold text-neutral-400" htmlFor="email">
          Email
        </label>
        <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-semibold text-neutral-400" htmlFor="phone">
          Phone <span className="font-normal opacity-80">(optional)</span>
        </label>
        <input className={inputClass} id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-semibold text-neutral-400" htmlFor="message">
          Message
        </label>
        <textarea
          className={`${inputClass} min-h-36 resize-y`}
          id="message"
          name="message"
          required
          placeholder="Tell us what you are looking for..."
        />
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-md bg-[#F52500] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff4a33] active:scale-[0.98]"
      >
        Send message
      </button>

      {status === "success" && (
        <p className="mt-4 rounded-lg bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200" role="status">
          Thanks — we will get back to you soon.
        </p>
      )}
      {status === "error" && (
        <p className="mt-4 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-200" role="status">
          Something went wrong. Please email us or try again.
        </p>
      )}
      {status === "config" && (
        <p className="mt-4 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-200" role="status">
          Set <code>contactFormAction</code> in <code>lib/site.ts</code> to your Formspree endpoint (or another POST
          URL).
        </p>
      )}
    </form>
  );
}
