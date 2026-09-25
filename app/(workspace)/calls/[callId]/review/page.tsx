import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PostCallOutcomeForm } from "@/components/PostCallOutcomeForm";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readDemoSessionFromCookies } from "@/lib/auth/demo";
import { getRepSession } from "@/lib/auth/session";
import { getCallWithLead } from "@/lib/calls/repository";
import { generateDuringCallGuidance } from "@/lib/intelligence/during-call";
import { getBusinessContextForLead } from "@/lib/leads/repository";
import { getOutcomeByCallId } from "@/lib/outcomes/repository";
import { mapCallOutcomeRow } from "@/lib/outcomes/mappers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type ReviewPageProps = {
  params: Promise<{ callId: string }>;
};

export default async function CallReviewPage({ params }: ReviewPageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const demoSession = await readDemoSessionFromCookies();
  const supabaseReady = getSupabasePublicEnv().ok;

  if (!supabaseReady && !demoSession) {
    return (
      <EmptyState
        title="Post-call review unavailable"
        description="Configure Supabase to load call outcomes."
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
  const guidance = await generateDuringCallGuidance({
    lead: callWithLead.lead,
    context,
  });

  const existingRow = supabaseReady ? await getOutcomeByCallId(callId) : null;
  const initialOutcome = existingRow
    ? mapCallOutcomeRow(existingRow, callWithLead.lead.id)
    : undefined;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/calls" className="hover:text-foreground">
            Calls
          </Link>
          <span className="mx-1.5">/</span>
          <Link
            href={`/calls/${callWithLead.call.id}/live`}
            className="hover:text-foreground"
          >
            Live
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">Review</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Post-call review · {callWithLead.lead.companyName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture structured outcome — qualification, pains, objections, and next action —
          before CRM and learning ingest (Tasks 7–8).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Discovery call with {callWithLead.lead.contactName ?? "the contact"} at{" "}
            {callWithLead.lead.companyName}. Guidance recommended: {guidance.nextBestAction}
          </p>
          {context.likelyPains.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {context.likelyPains.map((pain) => (
                <Badge key={pain} variant="success">
                  {pain}
                </Badge>
              ))}
            </div>
          ) : null}
          {guidance.checklist.length > 0 ? (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Discovery checklist cues</p>
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {guidance.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <PostCallOutcomeForm
        callId={callWithLead.call.id}
        companyName={callWithLead.lead.companyName}
        leadId={callWithLead.lead.id}
        initialOutcome={initialOutcome}
        suggestedPainPoints={initialOutcome ? undefined : context.likelyPains}
        suggestedObjection={
          initialOutcome ? undefined : guidance.objectionReframe ?? undefined
        }
        suggestedNextAction={initialOutcome ? undefined : guidance.nextBestAction}
        canPersist={supabaseReady}
      />
    </div>
  );
}
