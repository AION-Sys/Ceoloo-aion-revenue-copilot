import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MIGRATION_PATH,
  RLS_PROTECTED_TABLES,
  SALES_MOTION_MIGRATION_PATH,
  SCHEMA_TABLES,
} from "@/lib/supabase/schema";

function loadMigrationSql(): string {
  return readFileSync(join(process.cwd(), MIGRATION_PATH), "utf8");
}

describe("Task 1 — Supabase schema migration", () => {
  const sql = loadMigrationSql();

  it("creates all required tables in migration order", () => {
    for (const table of SCHEMA_TABLES) {
      expect(sql).toMatch(new RegExp(`create table public\\.${table}`, "i"));
    }

    const organizationsIndex = sql.indexOf("create table public.organizations");
    const businessContextsIndex = sql.indexOf("create table public.business_contexts");
    const leadsIndex = sql.indexOf("create table public.leads");
    const callsIndex = sql.indexOf("create table public.calls");
    const outcomesIndex = sql.indexOf("create table public.call_outcomes");
    const eventLogIndex = sql.indexOf("create table public.event_log");

    expect(organizationsIndex).toBeLessThan(businessContextsIndex);
    expect(businessContextsIndex).toBeLessThan(leadsIndex);
    expect(leadsIndex).toBeLessThan(callsIndex);
    expect(callsIndex).toBeLessThan(outcomesIndex);
    expect(outcomesIndex).toBeLessThan(eventLogIndex);
  });

  it("enables row level security on tenant-scoped tables", () => {
    for (const table of RLS_PROTECTED_TABLES) {
      expect(sql).toMatch(
        new RegExp(`alter table public\\.${table} enable row level security`, "i"),
      );
    }
  });

  it("scopes access via organization membership helper", () => {
    expect(sql).toMatch(/create or replace function public\.user_organization_ids\(\)/i);
    expect(sql).toMatch(/user_organization_ids\(\)/);
  });

  it("defines lead and call status constraints aligned with domain types", () => {
    expect(sql).toMatch(/check \(status in \('new', 'contacted', 'qualified', 'closed'\)\)/);
    expect(sql).toMatch(/check \(phase in \('pre', 'active', 'post', 'completed'\)\)/);
    expect(sql).toMatch(
      /check \(\s*qualification in \('unqualified', 'exploring', 'qualified', 'disqualified'\)\s*\)/,
    );
  });

  it("requires a call or lead reference on event_log rows", () => {
    expect(sql).toMatch(/check \(call_id is not null or lead_id is not null\)/);
  });
});

describe("AION sales motion migration", () => {
  const sql = readFileSync(join(process.cwd(), SALES_MOTION_MIGRATION_PATH), "utf8");

  it("renames business context columns to the workflow schema", () => {
    expect(sql).toMatch(/rename column services to existing_systems/i);
    expect(sql).toMatch(/rename column likely_pains to workflow_problems/i);
    expect(sql).toMatch(/rename column relevant_offer to recommended_service/i);
  });

  it("replaces lead status with the implementation funnel", () => {
    expect(sql).toMatch(/when 'new' then 'lead'/);
    expect(sql).toMatch(/when 'qualified' then 'qualified_opportunity'/);
    expect(sql).toMatch(/when 'closed' then 'closed_won'/);
    expect(sql).toContain("'business_audit'");
    expect(sql).toContain("'problem_diagnosis'");
    expect(sql).toContain("'solution_scope'");
    expect(sql).toContain("'proposal'");
    expect(sql).toContain("'onboarding'");
  });

  it("stores the AION qualification profile on call outcomes", () => {
    expect(sql).toMatch(/qualification_profile jsonb/i);
    expect(sql).toContain("currentWorkflow");
    expect(sql).toContain("recommendedService");
    expect(sql.toLowerCase()).not.toContain("capital need");
  });
});
