<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a Next.js 16 (Turbopack) marketing site + student-signup app backed by Prisma 7 and PostgreSQL. Standard scripts are documented in `README.md` (`npm run dev`, `lint`, `db:migrate`, `db:deploy`, `db:studio`). Notes below are the non-obvious cloud caveats.

- **PostgreSQL runs locally and is NOT auto-started on boot.** The update script only installs npm deps. Start the DB at the beginning of each session before running the app, migrations, or DB-touching tests: `sudo pg_ctlcluster 16 main start`. A local role/database `mahingan` (password `mahingan`) already exists in the VM snapshot.
- **`.env` is already present** (gitignored) with a working local `DATABASE_URL`/`DATABASE_URL_UNPOOLED` pointing at that local Postgres, plus `ADMIN_PASSWORD=admin123` and a generated `ADMIN_SESSION_SECRET`. The owner area at `/admin` uses that password.
- **Apply migrations with `npm run db:deploy`** (not `db:migrate`) in this non-interactive environment — `migrate dev` can prompt. Migrations live in `prisma/migrations`.
- **Email is intentionally skipped locally.** `RESEND_API_KEY` is blank, so signups are still recorded and the server logs `skipping notification and confirmation`. This is expected, not a failure.
- **Dev server** runs on port 3000. The Prisma client is generated into `lib/generated/` (gitignored) by `postinstall`/`prisma generate`; after changing `prisma/schema.prisma`, re-run `npx prisma generate`.
- **Core flow to smoke-test:** fill the signup form at `/signup` (the waiver requires a signature drawn on a canvas), submit to reach `/signup/thanks`, then log into `/admin` to see the student and their signed waiver.
