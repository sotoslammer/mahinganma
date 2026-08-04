/**
 * Formatting helpers shared by the signup form, the admin area, the waiver PDF and
 * the notification emails.
 *
 * Every formatter pins an explicit time zone. Waiver records are legal documents, so
 * the same record has to read identically no matter whether it is rendered on the
 * server, in the browser, or by a build running in another region.
 */

/** Saskatchewan does not observe daylight saving, so this offset is stable year-round. */
export const DISPLAY_TIME_ZONE = "America/Regina";

/**
 * Date-only columns come back from Postgres as midnight UTC. Formatting those in a
 * local zone west of UTC would shift them back a day, so date-only values are always
 * formatted in UTC while wall-clock timestamps use the gym's zone.
 */
export function formatDateOnly(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

/** ISO `YYYY-MM-DD`, read in UTC to match how date-only columns are stored. */
export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * Today's date in the gym's zone as `YYYY-MM-DD`.
 *
 * The signup page hands this to the form so the browser derives minor status from the
 * same day the server would, rather than from a visitor's own clock and zone.
 */
export function todayIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(value);
}

/** Full name from parts, tolerating missing or padded values. */
export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].map((p) => p?.trim() ?? "").filter(Boolean).join(" ");
}

/**
 * Loose comparison for checking a printed name against the name already on file.
 *
 * This exists to catch typos and wrong-person mistakes, not to prevent fraud — the
 * drawn signature is the actual artifact — so it errs towards accepting. Separators
 * are dropped entirely rather than normalised to spaces, which is what lets
 * "O'Brien-Smith", "OBrien Smith" and "obriensmith" all compare equal.
 */
export function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b) && normalizeName(a) !== "";
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}
