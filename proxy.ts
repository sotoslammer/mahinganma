import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/sign-in")) {
    return NextResponse.next();
  }

  const auth = getAuth();
  if (!auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const middleware = auth.middleware({
    loginUrl: "/admin/sign-in",
  });
  return middleware(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
