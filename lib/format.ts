const TZ = "America/Regina";

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatMoney(amountCents: number | null | undefined, currency = "cad"): string {
  const cents = amountCents ?? 0;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function studentName(first: string, last: string): string {
  return `${first} ${last}`.trim();
}

export function isQuietHours(now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  return hour < 9 || hour >= 21;
}
