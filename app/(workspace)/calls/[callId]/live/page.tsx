import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LiveCallWorkspace } from "@/components/calls/LiveCallWorkspace";
import { EmptyState } from "@/components/primitives/EmptyState";
import { DEMO_ORG_ID, readDemoSessionFromCookies } from "@/lib/auth/demo";
import { getRepSession } from "@/lib/auth/session";
import { getCallWithLead } from "@/lib/calls/repository";
import { DEMO_QUALIFICATION_PROFILE } from "@/lib/cockpit/demo";
import { generateDuringCallGuidance } from "@/lib/intelligence/during-call";
import { getBusinessContextForLead } from "@/lib/leads/repository";
import { getOutcomeByCallId } from "@/lib/outcomes/repository";
import { mapCallOutcomeRow } from "@/lib/outcomes/mappers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type LiveCallPageProps = {
  params: Promise<{ callId: string }>;
};

export default async function LiveCallPage({ params }: LiveCallPageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const demoSession = await readDemoSessionFromCookies();
  if (!getSupabasePublicEnv().ok && !demoSession) {
    return (
      <EmptyState
        title="Live call workspace unavailable"
        description="Configure Supabase to load prospect context and guidance."
        actionLabel="Back to calls"
        actionHref="/calls"
      />
    );
  }

  const { callId } = await params;
  const callWithLead = await getCallWithLead(callId);

  if (!callWithLead || callWithLead.lead.organizationId !== repSession.organizationId) {
    notFound();
  }

  const context = await getBusinessContextForLead(callWithLead.lead);

  let profile =
    callWithLead.lead.organizationId === DEMO_ORG_ID
      ? DEMO_QUALIFICATION_PROFILE
      : undefined;
  let nextAction: string | undefined;

  if (getSupabasePublicEnv().ok) {
    try {
      const existingOutcome = await getOutcomeByCallId(callWithLead.call.id);
      if (existingOutcome) {
        const mapped = mapCallOutcomeRow(existingOutcome, callWithLead.lead.id);
        profile = mapped.qualificationProfile ?? profile;
        nextAction = mapped.nextAction;
      }
    } catch {
      // Demo / missing Supabase — keep profile from demo fixtures when available.
    }
  }

  const guidance = await generateDuringCallGuidance({
    lead: callWithLead.lead,
    context,
    profile,
    nextAction,
    callId: callWithLead.call.id,
  });

  return (
    <div className="flex h-[calc(100svh-3.5rem-3rem)] flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        <Link href="/calls" className="hover:text-foreground">
          Calls
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/prospects/${callWithLead.lead.id}`}
          className="hover:text-foreground"
        >
          {callWithLead.lead.companyName}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">Live</span>
      </p>
      <LiveCallWorkspace
        callId={callWithLead.call.id}
        lead={callWithLead.lead}
        context={context}
        guidance={guidance}
      />
    </div>
  );
}
