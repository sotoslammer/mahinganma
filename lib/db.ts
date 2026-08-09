import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Resolves the Postgres URL from the usual Neon / Vercel Marketplace names.
 *
 * Prefer the pooled URL for runtime queries. Neon and the Vercel Storage UI may
 * inject any of these; we accept all of them so the preview doesn't fail just
 * because the variable was named differently.
 */
function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_POOLED
  );
}

function createClient() {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to the Vercel project " +
        "(Settings → Environment Variables) for Preview and Production, then redeploy.",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Dev hot-reload re-evaluates modules, which would otherwise open a new pool per reload.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

/**
 * Lazily constructed so `next build` can compile pages that import this module
 * without needing a live database. The client is only created on first query.
 *
 * A plain function rather than a Proxy: wrapping the client in a Proxy breaks
 * libraries that inspect method presence on the object (e.g. auth adapters).
 */
export function getPrisma(): ReturnType<typeof createClient> {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}
