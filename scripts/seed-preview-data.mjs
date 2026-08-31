#!/usr/bin/env node
/**
 * Seeds preview/test data in Supabase after migration is applied.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_REP_EMAIL (default: rep@demo.local)
 *   SEED_REP_PASSWORD (default: demo-rep-password)
 *
 * Usage:
 *   npm run seed:preview
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const repEmail = process.env.SEED_REP_EMAIL?.trim() ?? "rep@demo.local";
const repPassword = process.env.SEED_REP_PASSWORD?.trim() ?? "demo-rep-password";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CONTEXT_ID = "22222222-2222-4222-8222-222222222222";
const LEAD_ID = "33333333-3333-4333-8333-333333333333";

function requireEnv() {
  if (!url || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
}

async function main() {
  requireEnv();
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId;
  const existing = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = existing.data.users.find((user) => user.email === repEmail);

  if (found) {
    userId = found.id;
    console.log(`Using existing auth user: ${repEmail} (${userId})`);
  } else {
    const created = await supabase.auth.admin.createUser({
      email: repEmail,
      password: repPassword,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw created.error ?? new Error("Failed to create auth user");
    }
    userId = created.data.user.id;
    console.log(`Created auth user: ${repEmail} (${userId})`);
  }

  const { error: orgError } = await supabase.from("organizations").upsert({
    id: ORG_ID,
    name: "Demo Contractor Co",
  });
  if (orgError) throw orgError;

  const { error: memberError } = await supabase.from("organization_members").upsert(
    {
      organization_id: ORG_ID,
      user_id: userId,
      role: "rep",
    },
    { onConflict: "organization_id,user_id" },
  );
  if (memberError) throw memberError;

  const { error: contextError } = await supabase.from("business_contexts").upsert({
    id: CONTEXT_ID,
    organization_id: ORG_ID,
    industry: "home-services",
    services: ["HVAC repair", "maintenance"],
    likely_pains: ["slow lead response", "inconsistent follow-up"],
    relevant_offer: "conversion copilot trial",
  });
  if (contextError) throw contextError;

  const { error: leadError } = await supabase.from("leads").upsert({
    id: LEAD_ID,
    organization_id: ORG_ID,
    business_context_id: CONTEXT_ID,
    company_name: "Acme HVAC",
    contact_name: "Jordan Lee",
    source: "outbound",
    status: "new",
  });
  if (leadError) throw leadError;

  console.log("\nSeed complete.");
  console.log(`  Login: ${repEmail} / ${repPassword}`);
  console.log(`  Lead brief: /leads/${LEAD_ID}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
