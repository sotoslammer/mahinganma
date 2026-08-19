import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Turns anonymous visitors away from the owner area before a page renders.
 *
 * Next 16 renamed Middleware to Proxy and runs it on the Node.js runtime, so the same
 * HMAC check the pages use works here. This is still only the first gate: Server
 * Functions are POSTed to the route that uses them and can be reached directly, so
 * every admin page, route handler and action verifies again for itself.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    // Already signed in; no reason to sit on the login page.
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") return NextResponse.next();

  const loginUrl = new URL("/admin/login", request.url);
  // Send them back where they were headed once they sign in.
  if (pathname !== "/admin") loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
