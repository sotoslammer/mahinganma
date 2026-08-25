import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";

export async function POST() {
  const auth = getAuth();
  if (auth) await auth.signOut();
  redirect("/admin/sign-in");
}
