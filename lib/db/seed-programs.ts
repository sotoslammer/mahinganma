import { PROGRAMS } from "@/lib/programs";
import { requireDb } from "@/lib/db";
import { programs } from "@/lib/db/schema";

export async function ensurePrograms() {
  const db = requireDb();
  const existing = await db.select().from(programs);
  const bySlug = new Map(existing.map((row) => [row.slug, row]));
  for (const program of PROGRAMS) {
    const stripePriceId = process.env[program.stripePriceEnv]?.trim() || null;
    const current = bySlug.get(program.slug);
    if (!current) {
      await db.insert(programs).values({
        slug: program.slug,
        name: program.name,
        autoTag: program.autoTag,
        stripePriceId,
      });
      continue;
    }
    if (current.name !== program.name || current.autoTag !== program.autoTag || current.stripePriceId !== stripePriceId) {
      const { eq } = await import("drizzle-orm");
      await db
        .update(programs)
        .set({
          name: program.name,
          autoTag: program.autoTag,
          stripePriceId,
          updatedAt: new Date(),
        })
        .where(eq(programs.id, current.id));
    }
  }
}
