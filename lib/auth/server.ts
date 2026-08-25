import { createNeonAuth } from "@neondatabase/auth/next/server";
import { isAuthConfigured } from "@/lib/config";

type NeonAuth = ReturnType<typeof createNeonAuth>;

let cached: NeonAuth | null | undefined;

export function getAuth(): NeonAuth | null {
  if (cached !== undefined) return cached;
  if (!isAuthConfigured()) {
    cached = null;
    return null;
  }
  cached = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
      secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    },
  });
  return cached;
}
