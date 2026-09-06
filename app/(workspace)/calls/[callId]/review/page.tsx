import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readDemoSessionFromCookies } from "@/lib/auth/demo";
import { getRepSession } from "@/lib/auth/session";
import { getCallWithLead } from "@/lib/calls/repository";
import { generateDuringCallGuidance } from "@/lib/intelligence/during-call";
import { getBusinessContextForLead } from "@/lib/leads/repository";
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
  if (!getSupabasePublicEnv().ok && !demoSession) {
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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/calls" className="hover:text-foreground">
              Calls
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Review</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Post-call review · {callWithLead.lead.companyName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm structured facts before CRM writes. Confidence gate applies for automatic updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Approve</Button>
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button size="sm" variant="ghost">
            Send later
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Discovery call with {callWithLead.lead.contactName ?? "the contact"} at{" "}
            {callWithLead.lead.companyName}. Guidance recommended: {guidance.nextBestAction}
          </p>
          <p className="text-xs text-muted-foreground">
            Structured outcome capture remains wired through the existing post-call pipeline.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Facts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Fact label="Industry" value={context.industry} />
            <Fact label="Services" value={context.services.join(", ") || "—"} />
            <Fact label="Relevant offer" value={context.relevantOffer ?? "—"} />
            <Fact label="Qualification" value="Pending confirmation" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Objections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {guidance.objectionReframe ? (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Suggested reframe</p>
                <p className="mt-1 text-muted-foreground">{guidance.objectionReframe}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No objections captured yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Buying Signals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {context.likelyPains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signals extracted yet.</p>
            ) : (
              context.likelyPains.map((pain) => (
                <Badge key={pain} variant="success">
                  {pain}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Missing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {guidance.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Step</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{guidance.nextBestAction}</p>
          <div className="grid gap-2 md:grid-cols-3">
            <FollowUpDraft
              channel="SMS"
              body={`Hi ${callWithLead.lead.contactName?.split(" ")[0] ?? "there"} — following up on our call about ${context.relevantOffer ?? "next steps"}.`}
            />
            <FollowUpDraft
              channel="Email"
              body={`Thanks for the conversation today. Next step: ${guidance.nextBestAction}`}
            />
            <FollowUpDraft
              channel="Call reminder"
              body="Schedule follow-up before end of day tomorrow."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

function FollowUpDraft({ channel, body }: { channel: string; body: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {channel}
        </p>
        <Button size="sm" variant="ghost">
          Copy
        </Button>
      </div>
      <p className="text-sm leading-relaxed">{body}</p>
    </div>
  );
}
