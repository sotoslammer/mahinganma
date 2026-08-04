"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  checkPassword,
  clearAttempts,
  createSessionToken,
  isAdminConfigured,
  recordFailedAttempt,
  sessionCookieOptions,
  tooManyAttempts,
} from "@/lib/auth";

export type LoginState = { error?: string };

/** Only used to bucket failed sign-in attempts, so an unknown source is fine. */
async function clientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** Keeps an open redirect out of the `next` parameter by allowing only admin paths. */
function safeRedirect(target: string | undefined): string {
  if (!target || !target.startsWith("/admin") || target.startsWith("//")) return "/admin";
  return target;
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) {
    return {
      error:
        "Admin access is not configured on this server. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.",
    };
  }

  const ip = await clientIp();
  if (tooManyAttempts(ip)) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  const password = String(formData.get("password") ?? "");
  if (!password || !checkPassword(password)) {
    recordFailedAttempt(ip);
    // Deliberately vague: nothing here should confirm what a correct password looks like.
    return { error: "That password is not right." };
  }

  const token = createSessionToken();
  if (!token) return { error: "Admin access is not configured on this server." };

  clearAttempts(ip);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, sessionCookieOptions());

  redirect(safeRedirect(String(formData.get("next") ?? "")));
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
