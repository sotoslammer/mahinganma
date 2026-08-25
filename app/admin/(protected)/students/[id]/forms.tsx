"use client";

import { useState } from "react";
import { btnGhost, btnPrimary, inputClass } from "@/components/admin/ui";

export function RedirectButton({
  action,
  label,
  hidden,
  children,
}: {
  action: (formData: FormData) => Promise<{ url?: string | null; error?: string }>;
  label: string;
  hidden?: Record<string, string>;
  children?: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      action={async (formData) => {
        setError(null);
        const result = await action(formData);
        if (result?.url) {
          window.location.href = result.url;
          return;
        }
        if (result?.error) setError(result.error);
      }}
      className="flex flex-col gap-2"
    >
      {hidden
        ? Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      {children}
      <button type="submit" className={btnPrimary}>
        {label}
      </button>
      {error ? <p className="text-sm text-accent-hover">{error}</p> : null}
    </form>
  );
}

export function MessageForm({
  action,
  studentId,
  email,
  phone,
}: {
  action: (formData: FormData) => Promise<{ error?: string; ok?: boolean } | void>;
  studentId: string;
  email: string | null;
  phone: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        setError(null);
        setOk(false);
        const result = await action(formData);
        if (result && "error" in result && result.error) setError(result.error);
        else setOk(true);
      }}
    >
      <input type="hidden" name="studentId" value={studentId} />
      <div className="grid gap-3 md:grid-cols-3">
        <select name="channel" className={inputClass} defaultValue={email ? "email" : "sms"}>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
        <select name="kind" className={inputClass} defaultValue="transactional">
          <option value="transactional">Transactional</option>
          <option value="marketing">Marketing</option>
          <option value="one_off">One-off</option>
        </select>
        <input name="to" className={inputClass} defaultValue={email || phone || ""} placeholder="Recipient" />
      </div>
      <input name="subject" className={inputClass} placeholder="Subject (email)" />
      <textarea name="body" required rows={4} className={inputClass} placeholder="Message" />
      <button type="submit" className={btnGhost}>
        Send
      </button>
      {error ? <p className="text-sm text-accent-hover">{error}</p> : null}
      {ok ? <p className="text-sm text-[#7dffb4]">Sent.</p> : null}
    </form>
  );
}
