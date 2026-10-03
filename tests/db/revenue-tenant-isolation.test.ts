/**
 * Proves supabase/migrations/20261003120000_revenue_tenant_isolation.sql on a
 * real Postgres: a copy of the live revenue fabric (with its `using (true)`
 * policies and anon grants) is migrated, then two organizations try to read
 * and modify each other's records through every path the audit flagged.
 *
 * Needs a superuser connection string (the suite creates and drops its own
 * database):
 *   REVENUE_RLS_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm test
 * Skipped when the variable is unset.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const adminUrl = process.env.REVENUE_RLS_DATABASE_URL?.trim();
const root = path.resolve(__dirname, "../..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

const ISOLATION_MIGRATION = "supabase/migrations/20261003120000_revenue_tenant_isolation.sql";
const ORG_A = "00000000-0000-4000-8000-00000000000a";
const ORG_B = "00000000-0000-4000-8000-00000000000b";
const USER_A = "00000000-0000-4000-8000-0000000000a1";
const USER_B = "00000000-0000-4000-8000-0000000000b1";

type Session = { role: "anon" | "authenticated" | "service_role"; sub?: string };

describe.skipIf(!adminUrl)("revenue tenant isolation (Postgres)", () => {
  const dbName = `revenue_rls_${process.pid}_${Date.now()}`;
  let admin: pg.Client;
  let db: pg.Client;

  /** Runs `fn` as a PostgREST request would: API role + JWT claims, in a rolled-back transaction. */
  async function as<T>(session: Session, fn: (c: pg.Client) => Promise<T>): Promise<T> {
    await db.query("begin");
    try {
      await db.query(`set local role ${session.role}`);
      await db.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify(session.sub ? { sub: session.sub, role: session.role } : { role: session.role }),
      ]);
      return await fn(db);
    } finally {
      await db.query("rollback");
    }
  }

  const asA = <T>(fn: (c: pg.Client) => Promise<T>) => as({ role: "authenticated", sub: USER_A }, fn);
  const asB = <T>(fn: (c: pg.Client) => Promise<T>) => as({ role: "authenticated", sub: USER_B }, fn);
  const asAnon = <T>(fn: (c: pg.Client) => Promise<T>) => as({ role: "anon" }, fn);
  const asService = <T>(fn: (c: pg.Client) => Promise<T>) => as({ role: "service_role" }, fn);

  beforeAll(async () => {
    admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`create database ${dbName}`);

    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    db = new pg.Client({ connectionString: url.toString() });
    await db.connect();

    await db.query(read("tests/db/fixtures/supabase-shim.sql"));
    await db.query(read("supabase/migrations/20260829210000_initial_schema.sql"));
    await db.query(read("supabase/migrations/20260927120000_aion_sales_motion.sql"));
    await db.query(read("tests/db/fixtures/live-revenue-fabric.sql"));

    // Live state at migration time: one organization that owns every row.
    await db.query(
      `insert into auth.users (id, email) values ($1, 'a@example.test'), ($2, 'b@example.test')`,
      [USER_A, USER_B],
    );
    await db.query(`insert into public.organizations (id, name) values ($1, 'AION')`, [ORG_A]);
    await db.query(
      `insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'rep')`,
      [ORG_A, USER_A],
    );
    await db.query(`
      insert into public.revenue_leads (lead_id, company, created_by, updated_by)
        values ('LEAD-A1', 'Acme', 'revenue_intelligence_01', 'revenue_intelligence_01');
      insert into public.revex_research (lead_id, findings, created_by) values ('LEAD-A1', 'a', 'agent');
      insert into public.revenue_deals (lead_id) values ('LEAD-A1');
      insert into public.revenue_sync_events (event_id, lead_id, actor_id) values ('EV-1', 'LEAD-A1', 'airtable');
    `);

    // The pre-migration gap, reproduced: any signed-in user (B is in no org) reads everything.
    const leaked = await asB((c) => c.query("select lead_id from public.revenue_leads"));
    expect(leaked.rowCount).toBe(1);
    const forged = await asAnon((c) =>
      c.query("select public.revex_emit_event('forged', 'anon wrote this') as id"),
    );
    expect(forged.rows[0].id).toBeTruthy();
    await db.query("delete from public.events");

    await db.query(read(ISOLATION_MIGRATION));

    // A second tenant arrives after the migration.
    await db.query(`insert into public.organizations (id, name) values ($1, 'Other client')`, [ORG_B]);
    await db.query(
      `insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'rep')`,
      [ORG_B, USER_B],
    );
    await db.query(
      `insert into public.revenue_leads (lead_id, company, organization_id) values ('LEAD-B1', 'Beta', $1)`,
      [ORG_B],
    );
  }, 60_000);

  afterAll(async () => {
    await db?.end();
    if (admin) {
      await admin.query(`drop database if exists ${dbName} with (force)`);
      await admin.end();
    }
  });

  it("labels existing rows with the sole organization without firing update triggers", async () => {
    const { rows } = await db.query(`
      select (select count(*) from public.revenue_leads where lead_id = 'LEAD-A1' and organization_id = '${ORG_A}') as leads,
             (select count(*) from public.revex_research where organization_id = '${ORG_A}') as research,
             (select count(*) from public.revenue_sync_events where organization_id = '${ORG_A}') as sync_events,
             (select count(*) from public.events) as events
    `);
    expect(rows[0]).toEqual({ leads: "1", research: "1", sync_events: "1", events: "0" });
  });

  it("anon has no access to revenue tables, views or privileged RPCs", async () => {
    await expect(asAnon((c) => c.query("select * from public.revenue_leads"))).rejects.toThrow(
      /permission denied/,
    );
    await expect(asAnon((c) => c.query("select * from public.revex_ceo_pipeline"))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asAnon((c) => c.query("insert into public.revex_research (lead_id) values ('x')")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asAnon((c) => c.query("select public.revex_emit_event('forged', 'anon wrote this')")),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asAnon((c) => c.query("select public.revex_record_research('LEAD-A1', 'x')")),
    ).rejects.toThrow(/permission denied/);
    await expect(asAnon((c) => c.query("select public.user_organization_ids()"))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("each organization reads only its own records, including through views", async () => {
    const a = await asA((c) => c.query("select lead_id from public.revenue_leads order by 1"));
    const b = await asB((c) => c.query("select lead_id from public.revenue_leads order by 1"));
    expect(a.rows.map((r) => r.lead_id)).toEqual(["LEAD-A1"]);
    expect(b.rows.map((r) => r.lead_id)).toEqual(["LEAD-B1"]);

    const bView = await asB((c) => c.query("select lead_id from public.revex_ceo_pipeline"));
    expect(bView.rows.map((r) => r.lead_id)).toEqual(["LEAD-B1"]);
    const bResearch = await asB((c) => c.query("select * from public.revex_research"));
    expect(bResearch.rowCount).toBe(0);
  });

  it("one organization cannot modify another's records", async () => {
    const updated = await asB((c) =>
      c.query("update public.revex_research set findings = 'tampered' where lead_id = 'LEAD-A1'"),
    );
    expect(updated.rowCount).toBe(0);
    const deleted = await asB((c) => c.query("delete from public.revenue_deals where lead_id = 'LEAD-A1'"));
    expect(deleted.rowCount).toBe(0);

    await expect(
      asB((c) =>
        c.query(
          `insert into public.revex_research (lead_id, findings, organization_id) values ('LEAD-A1', 'planted', '${ORG_A}')`,
        ),
      ),
    ).rejects.toThrow(/row-level security/);

    // Moving a record into another tenant is rejected too.
    await expect(
      asA((c) =>
        c.query(`update public.revex_research set organization_id = '${ORG_B}' where lead_id = 'LEAD-A1'`),
      ),
    ).rejects.toThrow(/row-level security/);

    await expect(asA((c) => c.query("truncate public.revex_research"))).rejects.toThrow(
      /permission denied/,
    );

    const intact = await db.query("select findings from public.revex_research where lead_id = 'LEAD-A1'");
    expect(intact.rows).toEqual([{ findings: "a" }]);
  });

  it("new rows default to the caller's organization", async () => {
    const org = await asB(async (c) => {
      await c.query("insert into public.revex_research (lead_id, findings) values ('LEAD-B1', 'b')");
      const { rows } = await c.query("select organization_id from public.revex_research");
      return rows;
    });
    expect(org).toEqual([{ organization_id: ORG_B }]);
  });

  it("privileged lead RPCs refuse another organization's leads", async () => {
    await expect(
      asB((c) => c.query("select public.revex_open_work('LEAD-A1', 'research', 'look around')")),
    ).rejects.toThrow(/unknown lead_id LEAD-A1/);
    await expect(
      asB((c) => c.query("select public.revex_clear_legacy_status('LEAD-A1')")),
    ).rejects.toThrow(/unknown lead_id LEAD-A1/);
    await expect(
      asB((c) => c.query("select public.revex_emit_event('note', 'about A', null, null, 'LEAD-A1')")),
    ).rejects.toThrow(/unknown lead_id LEAD-A1/);

    const tasks = await db.query("select count(*)::int as n from public.aion_tasks");
    expect(tasks.rows[0].n).toBe(0);
  });

  it("audit identity comes from the authenticated principal, not the request", async () => {
    const result = await asA(async (c) => {
      const work = await c.query(
        "select public.revex_open_work('LEAD-A1', 'research', 'look around', 'ceo') as r",
      );
      // Definer RPC: writes the lead on the caller's behalf.
      await c.query("select public.revex_clear_legacy_status('LEAD-A1', 'ceo')");
      // Invoker RPC: the research insert is stamped; its lead update is a
      // no-op because revenue_leads only grants signed-in users SELECT.
      await c.query("select public.revex_record_research('LEAD-A1', 'new findings', p_actor_id => 'ceo')");
      // aion_tasks has no policy for signed-in users; read back as the owner.
      await c.query("reset role");
      const task = await c.query("select requested_by from public.aion_tasks where id = $1", [
        work.rows[0].r.id,
      ]);
      const lead = await c.query(
        "select created_by, updated_by, pipeline_stage from public.revenue_leads where lead_id = 'LEAD-A1'",
      );
      const research = await c.query(
        "select created_by, updated_by from public.revex_research where findings = 'new findings'",
      );
      return { task: task.rows[0], lead: lead.rows[0], research: research.rows[0] };
    });

    const actor = `user:${USER_A}`;
    expect(result.task).toEqual({ requested_by: actor });
    expect(result.lead).toEqual({
      created_by: "revenue_intelligence_01",
      updated_by: actor,
      pipeline_stage: "TARGET",
    });
    expect(result.research).toEqual({ created_by: actor, updated_by: actor });
  });

  it("events emitted on a signed-in user's behalf carry that user, and the claimed agent only as metadata", async () => {
    const events = await asA(async (c) => {
      await c.query("select public.revex_record_research('LEAD-A1', 'f', p_actor_id => 'ceo')");
      // events is readable only with the events.read permission; read back as the owner.
      await c.query("reset role");
      const { rows } = await c.query(
        "select event_type, agent_name, metadata->>'claimed_agent' as claimed from public.events order by event_type",
      );
      return rows;
    });
    expect(events).toEqual([
      { event_type: "research.completed", agent_name: `user:${USER_A}`, claimed: "ceo" },
    ]);
  });

  it("pipeline events from agent writes keep the agent identity", async () => {
    const events = await asService(async (c) => {
      await c.query(
        "update public.revenue_leads set pipeline_stage = 'RESEARCHED', updated_by = 'revenue_intelligence_01' where lead_id = 'LEAD-A1'",
      );
      const { rows } = await c.query("select event_type, agent_name from public.events");
      return rows;
    });
    expect(events).toEqual([{ event_type: "pipeline.stage_changed", agent_name: "revenue_intelligence_01" }]);
  });

  it("service_role agents keep their declared identity and must name the organization once there are two", async () => {
    const research = await asService(async (c) => {
      await c.query(
        `insert into public.revex_research (lead_id, findings, created_by, organization_id) values ('LEAD-B1', 's', 'revenue_intelligence_01', '${ORG_B}')`,
      );
      const { rows } = await c.query("select created_by from public.revex_research where findings = 's'");
      return rows;
    });
    expect(research).toEqual([{ created_by: "revenue_intelligence_01" }]);

    await expect(
      asService((c) => c.query("insert into public.revex_research (lead_id, findings) values ('LEAD-B1', 'x')")),
    ).rejects.toThrow(/organization_id/);
  });

  it("is safe to re-apply", async () => {
    await db.query(read(ISOLATION_MIGRATION));
    const { rows } = await db.query(`
      select tablename, string_agg(policyname, ',' order by policyname) as policies
        from pg_policies
       where schemaname = 'public' and tablename in ('revenue_leads', 'revenue_deals', 'revenue_sync_events')
       group by 1 order by 1
    `);
    expect(rows).toEqual([
      {
        tablename: "revenue_deals",
        policies: "org_members_delete,org_members_insert,org_members_select,org_members_update",
      },
      { tablename: "revenue_leads", policies: "org_members_select" },
    ]);
  });
});
