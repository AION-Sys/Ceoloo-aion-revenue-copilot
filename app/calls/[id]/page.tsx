import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DuringCallGuidancePanel } from "@/components/DuringCallGuidancePanel";
import { RepSessionBar } from "@/components/RepSessionBar";
import { getRepSession } from "@/lib/auth/session";
import { getCallWithLead } from "@/lib/calls/repository";
import { getBusinessContextForLead } from "@/lib/leads/repository";
import { generateDuringCallGuidance } from "@/lib/intelligence/during-call";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type CallGuidancePageProps = {
  params: Promise<{ id: string }>;
};

export default async function CallGuidancePage({ params }: CallGuidancePageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/");
  }

  if (!getSupabasePublicEnv().ok) {
    return (
      <main className="page">
        <RepSessionBar session={repSession} />
        <section className="card">
          <h1>During-call guidance unavailable</h1>
          <p>Supabase is not configured. Add project URL and anon key to load call data.</p>
          <Link className="session-link" href="/">
            Back to workspace
          </Link>
        </section>
      </main>
    );
  }

  const { id } = await params;
  const callWithLead = await getCallWithLead(id);

  if (!callWithLead || callWithLead.lead.organizationId !== repSession.organizationId) {
    notFound();
  }

  const context = await getBusinessContextForLead(callWithLead.lead);
  const initialGuidance = await generateDuringCallGuidance({
    lead: callWithLead.lead,
    context,
  });

  return (
    <main className="page">
      <RepSessionBar session={repSession} />
      <p className="breadcrumb">
        <Link href="/">Workspace</Link>
        <span className="session-separator">/</span>
        <Link href={`/leads/${callWithLead.lead.id}`}>{callWithLead.lead.companyName}</Link>
        <span className="session-separator">/</span>
        <span>Live call</span>
      </p>
      <DuringCallGuidancePanel
        callId={callWithLead.call.id}
        companyName={callWithLead.lead.companyName}
        initialGuidance={initialGuidance}
      />
    </main>
  );
}
