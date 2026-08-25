import { getAuth } from "@/lib/auth/server";

function notConfigured() {
  return Response.json({ error: "Auth is not configured." }, { status: 503 });
}

const auth = getAuth();

export const GET = auth ? auth.handler().GET : notConfigured;
export const POST = auth ? auth.handler().POST : notConfigured;
