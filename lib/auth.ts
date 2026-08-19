import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Single-owner authentication for /admin.
 *
 * There are no accounts to manage: one shared password from the environment, and a
 * session cookie signed with an HMAC so the server holds no session state. Every
 * check fails closed — if either environment variable is missing, nobody gets in.
 */

export const ADMIN_COOKIE = "mahingan_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET;
  return value && value.length >= 16 ? value : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/**
 * Compares digests rather than raw values so the comparison is constant time even
 * when the inputs differ in length, which `timingSafeEqual` alone will not allow.
 */
function safeEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

export function createSessionToken(now: Date = new Date()): string | null {
  const key = secret();
  if (!key) return null;
  const expiresAt = now.getTime() + SESSION_MAX_AGE_SECONDS * 1000;
  // The nonce makes tokens unique per sign-in, so one cannot be recognised by shape.
  const payload = `${expiresAt}.${randomBytes(9).toString("base64url")}`;
  return `${payload}.${sign(payload, key)}`;
}

/**
 * Pure verification, so the proxy and Server Components can share it. Node's crypto is
 * available in both: Next 16 runs proxy on the Node.js runtime.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  const key = secret();
  if (!key || !token) return false;

  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  if (!safeEqual(signature, sign(payload, key))) return false;

  const expiresAt = Number(payload.split(".")[0]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function isAdminConfigured(): boolean {
  return Boolean(secret()) && Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !isAdminConfigured()) return false;
  return safeEqual(input, expected);
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/**
 * Gate for every admin page, route handler and action.
 *
 * The proxy already turns anonymous visitors away, but Server Functions are reachable
 * by direct POST and the proxy can be bypassed by configuration mistakes, so
 * authorization is re-checked at each entry point rather than assumed.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) redirect("/admin/login");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Throttles password guessing per IP.
 *
 * In-memory, so it resets on deploy and is per-instance on serverless. That makes it a
 * speed bump against scripted guessing rather than a guarantee; the real protection is
 * a long password.
 */
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function tooManyAttempts(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip: string): void {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: Date.now() });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}
