import "dotenv/config";
import { defineConfig } from "prisma/config";

// Read through `process.env` rather than Prisma's `env()` helper: `env()` throws at
// config-load time when the variable is missing, which would break `prisma generate`
// (and therefore `npm install` and `next build`) on machines that have no database
// configured. Generation does not need a connection; only the migrate commands do,
// and those still fail with a clear error when the URL is empty.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
