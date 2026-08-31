#!/usr/bin/env node
/**
 * Applies the initial schema migration via direct Postgres connection.
 * Requires DATABASE_URL (Supabase → Settings → Database → Connection string URI).
 *
 * Usage:
 *   DATABASE_URL='postgresql://postgres.[ref]:[password]@...' node scripts/apply-migration.mjs
 */

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260829210000_initial_schema.sql",
);

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL (Postgres connection URI from Supabase dashboard).");
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  await client.connect();
  try {
    await client.query(sql);
    const result = await client.query(
      "select to_regclass('public.organizations') as organizations_table",
    );
    console.log("Migration applied.", result.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
