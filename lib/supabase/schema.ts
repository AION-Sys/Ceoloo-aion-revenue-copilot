/**
 * Schema metadata for migrations and tests (Task 1).
 */

export const SCHEMA_TABLES = [
  "organizations",
  "organization_members",
  "business_contexts",
  "leads",
  "calls",
  "call_outcomes",
  "event_log",
] as const;

export type SchemaTable = (typeof SCHEMA_TABLES)[number];

export const RLS_PROTECTED_TABLES = SCHEMA_TABLES;

export const MIGRATION_PATH = "supabase/migrations/20260829210000_initial_schema.sql";
