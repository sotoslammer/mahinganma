function isTruthy(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["yes", "true", "1", "on", "checked", "y"].includes(value.trim().toLowerCase());
  }
  return false;
}

type CustomField = {
  value?: unknown;
  displayText?: string;
};

function fieldMap(raw: unknown): CustomField[] {
  if (!raw || typeof raw !== "object") return [];
  return Object.values(raw as Record<string, CustomField>);
}

function matchesLabel(label: string, needles: string[]): boolean {
  const haystack = label.toLowerCase();
  return needles.some((needle) => haystack.includes(needle));
}

export function extractConsents(waiver: {
  marketingAllowed?: unknown;
  customWaiverFields?: unknown;
  participants?: Array<{ customParticipantFields?: unknown }>;
}): { email: boolean; sms: boolean } {
  const emailNeedles = (process.env.SMARTWAIVER_CONSENT_EMAIL_FIELD ?? "email,marketing,newsletter,updates")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const smsNeedles = (process.env.SMARTWAIVER_CONSENT_SMS_FIELD ?? "sms,text message,texting")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  let email = isTruthy(waiver.marketingAllowed);
  let sms = false;

  const fields = [
    ...fieldMap(waiver.customWaiverFields),
    ...(waiver.participants ?? []).flatMap((participant) => fieldMap(participant.customParticipantFields)),
  ];

  for (const field of fields) {
    const label = field.displayText ?? "";
    if (matchesLabel(label, emailNeedles) && isTruthy(field.value)) email = true;
    if (matchesLabel(label, smsNeedles) && isTruthy(field.value)) sms = true;
  }

  return { email, sms };
}
