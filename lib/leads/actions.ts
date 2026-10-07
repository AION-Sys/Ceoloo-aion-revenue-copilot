"use server";

import { redirect } from "next/navigation";
import { readDemoSessionFromCookies } from "@/lib/auth/demo";
import { getRepSession } from "@/lib/auth/session";
import { getOrCreateActiveCallForLead } from "@/lib/calls/repository";
import { getLeadById } from "@/lib/leads/repository";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function startCallForLead(leadId: string) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const demoSession = await readDemoSessionFromCookies();
  if (!getSupabasePublicEnv().ok && !demoSession) {
    redirect(`/prospects/${leadId}/prep`);
  }

  const lead = await getLeadById(leadId);
  if (!lead || lead.organizationId !== repSession.organizationId) {
    redirect("/dashboard");
  }

  const call = await getOrCreateActiveCallForLead(leadId, repSession.userId);
  if (!call) {
    redirect(`/prospects/${leadId}/prep`);
  }

  redirect(`/calls/${call.id}/live`);
}
