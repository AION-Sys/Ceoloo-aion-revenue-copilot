import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CrmApprovalPanel } from "@/components/cockpit/CrmApprovalPanel";
import { LineageTrail } from "@/components/cockpit/LineageTrail";
import { PostCallOutcomeForm } from "@/components/PostCallOutcomeForm";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readDemoSessionFromCookies } from "@/lib/auth/demo";
import { getRepSession } from "@/lib/auth/session";
import { getCallWithLead } from "@/lib/calls/repository";
import { buildCrmProposalsFromOutcome } from "@/lib/cockpit/crm-proposals";
import { DEMO_CRM_PROPOSALS, isDemoOrganization } from "@/lib/cockpit/demo";
import { buildFollowUpDraftFromOutcome } from "@/lib/cockpit/follow-up";
import { buildLineageTrail } from "@/lib/cockpit/lineage";
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

  const demo = isDemoOrganization(callWithLead.lead.organizationId);
  const proposals = initialOutcome
    ? buildCrmProposalsFromOutcome({
        lead: callWithLead.lead,
        outcome: initialOutcome,
      })
    : demo
      ? DEMO_CRM_PROPOSALS
      : [];

  const followUpPreview = initialOutcome
    ? buildFollowUpDraftFromOutcome({
        lead: callWithLead.lead,
        outcome: initialOutcome,
      })
    : null;

  const lineage = buildLineageTrail({
    leadId: callWithLead.lead.id,
    hasConversation: true,
    hasEvidence: Boolean(
      initialOutcome?.painPoints.length ||
        initialOutcome?.objections.length ||
        context.workflowProblems.length,
    ),
    recommendation: initialOutcome?.nextAction || guidance.nextBestAction,
    repDecision: initialOutcome
      ? `Outcome saved as ${initialOutcome.qualification}`
      : "Capture and save the structured outcome",
    crmProposal: proposals[0] ?? null,
    outcome: initialOutcome ?? null,
  });

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
          Capture structured outcome, review CRM drafts, and keep draft≠confirmed clear.
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
          {context.workflowProblems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {context.workflowProblems.map((problem) => (
                <Badge key={problem} variant="success">
                  {problem}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <PostCallOutcomeForm
        callId={callWithLead.call.id}
        companyName={callWithLead.lead.companyName}
        leadId={callWithLead.lead.id}
        initialOutcome={initialOutcome}
        suggestedPainPoints={initialOutcome ? undefined : context.workflowProblems}
        suggestedObjection={
          initialOutcome ? undefined : guidance.objectionReframe ?? undefined
        }
        suggestedNextAction={initialOutcome ? undefined : guidance.nextBestAction}
        canPersist={supabaseReady}
      />

      <CrmApprovalPanel initialProposals={proposals} />

      <LineageTrail trail={lineage} />

      <Card>
        <CardHeader>
          <CardTitle>Follow-up draft preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {followUpPreview ? (
            <>
              <p className="font-medium">{followUpPreview.subject}</p>
              <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-xs">
                {followUpPreview.body}
              </pre>
              <p className="text-xs text-muted-foreground">
                Draft only. Approve and confirm send in{" "}
                <Link href="/follow-up" className="text-ai hover:underline">
                  Follow-Up
                </Link>
                .
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              Save an outcome to generate a follow-up draft. Nothing is sent from this screen.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
