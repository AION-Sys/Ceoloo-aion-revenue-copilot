#!/usr/bin/env node
/**
 * Applies schema migrations in filename order via direct Postgres connection.
 * Requires DATABASE_URL (Supabase → Settings → Database → Connection string URI).
 *
 * Usage:
 *   DATABASE_URL='postgresql://postgres.[ref]:[password]@...' node scripts/apply-migration.mjs
 */

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const migrationsDir = path.join(process.cwd(), "supabase/migrations");

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL (Postgres connection URI from Supabase dashboard).");
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  await client.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await client.query(sql);
      console.log(`Applied ${file}`);
    }
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
