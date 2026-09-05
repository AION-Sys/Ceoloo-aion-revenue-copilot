import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DuringCallGuidancePanel } from "@/components/DuringCallGuidancePanel";
import { EmptyState } from "@/components/primitives/EmptyState";
import { readDemoSessionFromCookies } from "@/lib/auth/demo";
import { getRepSession } from "@/lib/auth/session";
import { getCallWithLead } from "@/lib/calls/repository";
import { getBusinessContextForLead } from "@/lib/leads/repository";
import { generateDuringCallGuidance } from "@/lib/intelligence/during-call";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type CallGuidancePageProps = {
  params: Promise<{ callId: string }>;
};

export default async function CallGuidancePage({ params }: CallGuidancePageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const demoSession = await readDemoSessionFromCookies();
  if (!getSupabasePublicEnv().ok && !demoSession) {
    return (
      <EmptyState
        title="During-call guidance unavailable"
        description="Supabase is not configured. Add project URL and anon key to load call data."
        actionLabel="Back to dashboard"
        actionHref="/dashboard"
      />
    );
  }

  const { callId } = await params;
  const callWithLead = await getCallWithLead(callId);

  if (!callWithLead || callWithLead.lead.organizationId !== repSession.organizationId) {
    notFound();
  }

  const context = await getBusinessContextForLead(callWithLead.lead);
  const initialGuidance = await generateDuringCallGuidance({
    lead: callWithLead.lead,
    context,
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Workspace
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/leads/${callWithLead.lead.id}`}
          className="hover:text-foreground"
        >
          {callWithLead.lead.companyName}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">Live call</span>
        <span className="mx-2 text-border">·</span>
        <Link
          href={`/calls/${callId}/live`}
          className="text-ai hover:underline"
        >
          Open three-panel live workspace
        </Link>
      </p>
      <DuringCallGuidancePanel
        callId={callWithLead.call.id}
        companyName={callWithLead.lead.companyName}
        initialGuidance={initialGuidance}
      />
    </div>
  );
}
