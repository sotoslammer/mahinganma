"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { SignaturePad } from "@/components/signup/SignaturePad";
import { WaiverDocument } from "@/components/signup/WaiverDocument";
import { submitSignup, type SignupState } from "@/app/signup/actions";
import { fullName } from "@/lib/format";
import {
  PROGRAM_LABELS,
  PROGRAM_VALUES,
  type ProgramValue,
  isMinorOn,
  parseIsoDate,
} from "@/lib/validation/signup";
import { AGE_OF_MAJORITY, renderWaiverText } from "@/lib/waiver";

const inputClass =
  "w-full rounded-lg border border-border-strong/40 bg-[#0a0a0a] px-4 py-3 text-[#eaeaea] outline-none transition focus:border-accent";
const errorInputClass = "border-red-500/70";

type Props = {
  initialProgram: ProgramValue;
  /**
   * Today's date from the server as `YYYY-MM-DD`. Deriving minor status from a
   * server-supplied date keeps the first client render identical to the server's,
   * which a bare `new Date()` could not guarantee across time zones.
   */
  todayIso: string;
};

const EMPTY_VALUES = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  experience: "",
  guardianFirstName: "",
  guardianLastName: "",
  guardianRelationship: "",
  guardianEmail: "",
  guardianPhone: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  medicalNotes: "",
  signerName: "",
  website: "",
};

export function SignupForm({ initialProgram, todayIso }: Props) {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(submitSignup, {});

  // Every field is controlled because React 19 resets uncontrolled inputs once an
  // action returns, which would empty a long form the moment validation failed.
  const [values, setValues] = useState(EMPTY_VALUES);
  const [program, setProgram] = useState<ProgramValue>(initialProgram);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [agreeWaiver, setAgreeWaiver] = useState(false);
  const [signature, setSignature] = useState("");

  const set = (field: keyof typeof EMPTY_VALUES) => (value: string) =>
    setValues((previous) => ({ ...previous, [field]: value }));

  const today = parseIsoDate(todayIso) ?? new Date();
  const dateOfBirth = parseIsoDate(values.dateOfBirth);
  const isMinor = dateOfBirth ? isMinorOn(dateOfBirth, today) : false;

  const studentName = fullName(values.firstName, values.lastName);
  const guardianName = fullName(values.guardianFirstName, values.guardianLastName);

  // Cheap enough to rebuild every keystroke, and rebuilding keeps the preview exactly
  // in step with the fields it interpolates.
  const waiverText = renderWaiverText({
    studentName,
    studentDateOfBirth: dateOfBirth,
    isMinor,
    guardianName,
    guardianRelationship: values.guardianRelationship,
    programLabel: PROGRAM_LABELS[program],
  });

  const errors = state.fieldErrors ?? {};
  const canSubmit = !pending && signature !== "" && agreeWaiver;

  return (
    <form action={formAction} className="relative flex flex-col gap-8" noValidate>
      <Section title="Student details" subtitle="Who is coming to train?">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="firstName" label="First name" error={errors.firstName} required>
            <input
              className={`${inputClass} ${errors.firstName ? errorInputClass : ""}`}
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              value={values.firstName}
              onChange={(e) => set("firstName")(e.target.value)}
            />
          </Field>
          <Field id="lastName" label="Last name" error={errors.lastName} required>
            <input
              className={`${inputClass} ${errors.lastName ? errorInputClass : ""}`}
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={values.lastName}
              onChange={(e) => set("lastName")(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="dateOfBirth"
            label="Date of birth"
            error={errors.dateOfBirth}
            hint={`Students under ${AGE_OF_MAJORITY} need a parent or guardian to sign.`}
            required
          >
            <input
              className={`${inputClass} ${errors.dateOfBirth ? errorInputClass : ""}`}
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              max={todayIso}
              value={values.dateOfBirth}
              onChange={(e) => set("dateOfBirth")(e.target.value)}
            />
          </Field>
          <Field id="program" label="Program" error={errors.program}>
            <select
              className={inputClass}
              id="program"
              name="program"
              value={program}
              onChange={(e) => setProgram(e.target.value as ProgramValue)}
            >
              {PROGRAM_VALUES.map((value) => (
                <option key={value} value={value}>
                  {PROGRAM_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="email"
            label={isMinor ? "Student email (optional)" : "Email"}
            error={errors.email}
            required={!isMinor}
          >
            <input
              className={`${inputClass} ${errors.email ? errorInputClass : ""}`}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => set("email")(e.target.value)}
            />
          </Field>
          <Field id="phone" label="Phone (optional)" error={errors.phone}>
            <input
              className={inputClass}
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => set("phone")(e.target.value)}
            />
          </Field>
        </div>

        <Field
          id="experience"
          label="Martial arts experience (optional)"
          hint="Belt rank, other gyms, or nothing at all — all are welcome."
        >
          <textarea
            className={`${inputClass} min-h-20 resize-y`}
            id="experience"
            name="experience"
            value={values.experience}
            onChange={(e) => set("experience")(e.target.value)}
          />
        </Field>
      </Section>

      {isMinor && (
        <Section
          title="Parent or legal guardian"
          subtitle={`${studentName || "This student"} is under ${AGE_OF_MAJORITY}, so a parent or legal guardian must complete and sign this form.`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="guardianFirstName" label="First name" error={errors.guardianFirstName} required>
              <input
                className={`${inputClass} ${errors.guardianFirstName ? errorInputClass : ""}`}
                id="guardianFirstName"
                name="guardianFirstName"
                value={values.guardianFirstName}
                onChange={(e) => set("guardianFirstName")(e.target.value)}
              />
            </Field>
            <Field id="guardianLastName" label="Last name" error={errors.guardianLastName} required>
              <input
                className={`${inputClass} ${errors.guardianLastName ? errorInputClass : ""}`}
                id="guardianLastName"
                name="guardianLastName"
                value={values.guardianLastName}
                onChange={(e) => set("guardianLastName")(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              id="guardianRelationship"
              label="Relationship"
              error={errors.guardianRelationship}
              required
            >
              <input
                className={`${inputClass} ${errors.guardianRelationship ? errorInputClass : ""}`}
                id="guardianRelationship"
                name="guardianRelationship"
                placeholder="Mother, father, legal guardian…"
                value={values.guardianRelationship}
                onChange={(e) => set("guardianRelationship")(e.target.value)}
              />
            </Field>
            <Field id="guardianEmail" label="Email" error={errors.guardianEmail} required>
              <input
                className={`${inputClass} ${errors.guardianEmail ? errorInputClass : ""}`}
                id="guardianEmail"
                name="guardianEmail"
                type="email"
                value={values.guardianEmail}
                onChange={(e) => set("guardianEmail")(e.target.value)}
              />
            </Field>
            <Field id="guardianPhone" label="Phone" error={errors.guardianPhone} required>
              <input
                className={`${inputClass} ${errors.guardianPhone ? errorInputClass : ""}`}
                id="guardianPhone"
                name="guardianPhone"
                type="tel"
                value={values.guardianPhone}
                onChange={(e) => set("guardianPhone")(e.target.value)}
              />
            </Field>
          </div>
        </Section>
      )}

      <Section title="Emergency contact" subtitle="Someone we can reach if there is an injury in class.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field id="emergencyName" label="Name" error={errors.emergencyName} required>
            <input
              className={`${inputClass} ${errors.emergencyName ? errorInputClass : ""}`}
              id="emergencyName"
              name="emergencyName"
              value={values.emergencyName}
              onChange={(e) => set("emergencyName")(e.target.value)}
            />
          </Field>
          <Field id="emergencyPhone" label="Phone" error={errors.emergencyPhone} required>
            <input
              className={`${inputClass} ${errors.emergencyPhone ? errorInputClass : ""}`}
              id="emergencyPhone"
              name="emergencyPhone"
              type="tel"
              value={values.emergencyPhone}
              onChange={(e) => set("emergencyPhone")(e.target.value)}
            />
          </Field>
          <Field id="emergencyRelationship" label="Relationship (optional)">
            <input
              className={inputClass}
              id="emergencyRelationship"
              name="emergencyRelationship"
              value={values.emergencyRelationship}
              onChange={(e) => set("emergencyRelationship")(e.target.value)}
            />
          </Field>
        </div>

        <Field
          id="medicalNotes"
          label="Medical conditions, injuries or allergies (optional)"
          hint="Anything a coach should know before class. Shared only with our instructors."
        >
          <textarea
            className={`${inputClass} min-h-20 resize-y`}
            id="medicalNotes"
            name="medicalNotes"
            value={values.medicalNotes}
            onChange={(e) => set("medicalNotes")(e.target.value)}
          />
        </Field>
      </Section>

      <Section
        title="Waiver"
        subtitle="Please read this in full. Signing it is a condition of training with us."
      >
        <div className="max-h-[380px] overflow-y-auto rounded-xl border border-border-subtle bg-[#0a0a0a] p-5">
          <WaiverDocument documentText={waiverText} />
        </div>

        <Field
          id="signerName"
          label={isMinor ? "Parent or guardian full name" : "Your full name"}
          error={errors.signerName}
          hint="Type it exactly as entered above. This is the printed name beside your signature."
          required
        >
          <input
            className={`${inputClass} ${errors.signerName ? errorInputClass : ""}`}
            id="signerName"
            name="signerName"
            value={values.signerName}
            onChange={(e) => set("signerName")(e.target.value)}
          />
        </Field>

        <SignaturePad
          name="signatureData"
          label={isMinor ? "Parent or guardian signature" : "Signature"}
          value={signature}
          onValueChange={setSignature}
          error={errors.signatureData}
          hint="Sign with your finger, a stylus, or your mouse."
        />

        <Checkbox
          id="agreeWaiver"
          name="agreeWaiver"
          checked={agreeWaiver}
          onChange={setAgreeWaiver}
          error={errors.agreeWaiver}
        >
          {isMinor
            ? `I am the parent or legal guardian of ${studentName || "this student"}, I have read and understood the waiver above, and I agree to it on their behalf and my own.`
            : "I have read and understood the waiver above and I agree to it."}
        </Checkbox>

        <Checkbox id="photoConsent" name="photoConsent" checked={photoConsent} onChange={setPhotoConsent}>
          Optional: I allow photos and video taken in class to be used on the gym&apos;s website and
          social media.
        </Checkbox>
      </Section>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div className="pointer-events-none absolute -left-[10000px] top-0 opacity-0" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => set("website")(e.target.value)}
        />
      </div>

      {state.message && (
        <p className="rounded-lg bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">
          {state.message}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex w-full items-center justify-center rounded-[7px] bg-accent px-5 py-3.5 text-sm font-medium text-white transition hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:px-8"
        >
          {pending ? "Submitting…" : "Sign waiver and join"}
        </button>
        {!pending && !signature && (
          <p className="mt-2 text-xs text-dimmer">Draw your signature above to continue.</p>
        )}
        {!pending && signature && !agreeWaiver && (
          <p className="mt-2 text-xs text-dimmer">
            Tick the box confirming you agree to the waiver to continue.
          </p>
        )}
        <p className="mt-3 text-xs text-dimmer">
          Questions first? <Link href="/#contact" className="underline underline-offset-[3px]">Send us a note</Link>{" "}
          instead.
        </p>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-xl border border-border-subtle bg-surface p-5 md:p-7">
      <legend className="px-2 text-[15px] font-medium md:text-base">{title}</legend>
      {subtitle && <p className="mb-5 mt-1 text-[13px] text-dim">{subtitle}</p>}
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-dim" htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-dimmer">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Checkbox({
  id,
  name,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-dim" htmlFor={id}>
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-accent"
        />
        <span>{children}</span>
      </label>
      {error && (
        <p className="mt-1.5 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
