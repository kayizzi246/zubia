import type { Config } from "drizzle-kit";

/*
  Drizzle Kit config, used by `npm run db:studio` to browse the data.

  Note that db/migrations/*.sql is the source of truth for the schema, not
  drizzle-kit's generator. The hand-written SQL holds CHECK constraints and
  partial indexes that the generator cannot express, and Docker applies it
  on first start. Do not run `drizzle-kit push` against a real database: it
  would try to drop what it does not understand.
*/

export default {
  schema: "./lib/db/schema.ts",
  out: "../db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Keeps the generator away from anything the app does not own.
  schemaFilter: ["public"],
} satisfies Config;
