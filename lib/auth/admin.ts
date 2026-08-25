import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { isAdminEmail, isAuthConfigured } from "@/lib/config";

export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
};

export async function getAdminUser(): Promise<AdminUser | null> {
  if (!isAuthConfigured()) return null;
  const auth = getAuth();
  if (!auth) return null;
  const { data: session } = await auth.getSession();
  const email = session?.user?.email;
  if (!email || !isAdminEmail(email)) return null;
  return {
    id: session.user.id,
    email,
    name: session.user.name,
  };
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/sign-in");
  return user;
}
