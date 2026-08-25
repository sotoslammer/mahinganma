"use server";

import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { isAdminEmail, isAuthConfigured } from "@/lib/config";

export async function signInWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  if (!isAuthConfigured()) {
    return { error: "Admin sign-in is not configured yet (Neon Auth env vars are missing)." };
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };
  if (!isAdminEmail(email)) {
    return { error: "This email is not authorized for admin access." };
  }
  const auth = getAuth();
  if (!auth) return { error: "Admin sign-in is not configured." };
  const { error } = await auth.signIn.email({ email, password });
  if (error) return { error: error.message || "Could not sign in." };
  redirect("/admin");
}
