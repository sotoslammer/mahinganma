"use client";

import { useState } from "react";
import { PROGRAMS } from "@/lib/programs";
import { btnPrimary, cardClass, inputClass, labelClass } from "@/components/admin/ui";
import { sendBulkMessage } from "./actions";

export function Composer() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className={`${cardClass} space-y-4`}
      action={async (formData) => {
        setError(null);
        setResult(null);
        const response = await sendBulkMessage(formData);
        if (response.error) setError(response.error);
        else if ("sent" in response) {
          setResult(
            typeof response.sent === "number"
              ? `Sent ${response.sent}. Skipped ${response.skipped ?? 0}.`
              : "Broadcast queued.",
          );
        }
      }}
    >
      <h2 className="text-lg font-medium">Compose</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <select name="channel" className={inputClass} defaultValue="email">
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
        <select name="kind" className={inputClass} defaultValue="marketing">
          <option value="marketing">Marketing</option>
          <option value="transactional">Transactional</option>
        </select>
        <select name="program" className={inputClass} defaultValue="">
          <option value="">All programs</option>
          {PROGRAMS.map((program) => (
            <option key={program.slug} value={program.slug}>
              {program.name}
            </option>
          ))}
        </select>
        <select name="status" className={inputClass} defaultValue="active">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
        </select>
      </div>
      <label className={labelClass} htmlFor="subject">
        Subject
      </label>
      <input id="subject" name="subject" className={inputClass} placeholder="Class update" />
      <label className={labelClass} htmlFor="body">
        Body
      </label>
      <textarea id="body" name="body" required rows={6} className={inputClass} placeholder="Write the message…" />
      <label className="flex items-center gap-2 text-sm text-dim">
        <input type="checkbox" name="broadcast" />
        Send email via Resend Broadcast (whole marketing segment)
      </label>
      <button type="submit" className={btnPrimary}>
        Send
      </button>
      {error ? <p className="text-sm text-accent-hover">{error}</p> : null}
      {result ? <p className="text-sm text-[#7dffb4]">{result}</p> : null}
    </form>
  );
}
