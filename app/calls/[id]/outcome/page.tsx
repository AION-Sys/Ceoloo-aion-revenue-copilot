import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PostCallOutcomeForm } from "@/components/PostCallOutcomeForm";
import { RepSessionBar } from "@/components/RepSessionBar";
import { getRepSession } from "@/lib/auth/session";
import { getCallWithLead } from "@/lib/calls/repository";
import { getOutcomeByCallId } from "@/lib/outcomes/repository";
import { mapCallOutcomeRow } from "@/lib/outcomes/mappers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type PostCallOutcomePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostCallOutcomePage({ params }: PostCallOutcomePageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/");
  }

  if (!getSupabasePublicEnv().ok) {
    return (
      <main className="page">
        <RepSessionBar session={repSession} />
        <section className="card">
          <h1>Post-call outcome unavailable</h1>
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

  const existingRow = await getOutcomeByCallId(id);
  const initialOutcome = existingRow
    ? mapCallOutcomeRow(existingRow, callWithLead.lead.id)
    : undefined;

  return (
    <main className="page">
      <RepSessionBar session={repSession} />
      <p className="breadcrumb">
        <Link href="/">Workspace</Link>
        <span className="session-separator">/</span>
        <Link href={`/leads/${callWithLead.lead.id}`}>{callWithLead.lead.companyName}</Link>
        <span className="session-separator">/</span>
        <Link href={`/calls/${callWithLead.call.id}`}>Live call</Link>
        <span className="session-separator">/</span>
        <span>Outcome</span>
      </p>
      <PostCallOutcomeForm
        callId={callWithLead.call.id}
        companyName={callWithLead.lead.companyName}
        leadId={callWithLead.lead.id}
        initialOutcome={initialOutcome}
      />
    </main>
  );
}
