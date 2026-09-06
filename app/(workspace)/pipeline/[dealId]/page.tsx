import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/primitives/EmptyState";
import { ReadinessScore } from "@/components/primitives/ReadinessScore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRepSession } from "@/lib/auth/session";
import { getPreCallBriefForLead } from "@/lib/intelligence/brief";

type DealPageProps = {
  params: Promise<{ dealId: string }>;
};

const REQUIREMENTS = [
  "Application",
  "4 months bank statements",
  "MTD",
  "ID",
  "Voided check",
  "Tax returns",
  "Additional underwriting documents",
] as const;

export default async function DealDetailPage({ params }: DealPageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const { dealId } = await params;
  const result = await getPreCallBriefForLead(dealId, repSession.organizationId);
  if (!result.ok) {
    notFound();
  }

  const { lead, context, recommendedQuestions } = result.brief;
  const likelyPains = context.likelyPains;
  const relevantOffer = context.relevantOffer ?? "";

  return (
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href="/pipeline" className="hover:text-foreground">
                Pipeline
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">{lead.companyName}</span>
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {lead.contactName ?? lead.companyName}
            </h1>
          </div>
          <Button asChild size="sm">
            <Link href={`/leads/${lead.id}`}>Open pre-call brief</Link>
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Funding / Opportunity</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <Field label="Amount requested" value="—" />
                <Field label="Product" value={relevantOffer || "—"} />
                <Field label="Purpose" value={likelyPains[0] ?? "—"} />
                <Field label="Stage" value={lead.status ?? "new"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <Field label="Industry" value={context.industry} />
                <Field label="Services" value={context.services.join(", ") || "—"} />
                <Field label="Source" value={lead.source ?? "—"} />
                <Field label="Ownership" value="—" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {REQUIREMENTS.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded border" disabled />
                    {item}
                  </label>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="activity">
            <EmptyState
              title="No activity yet"
              description="Calls, emails, documents, and stage changes will appear in this timeline."
            />
          </TabsContent>
          <TabsContent value="calls">
            <EmptyState
              title="No calls linked"
              description="Start a call from the pre-call brief to attach conversation history."
              actionLabel="Open brief"
              actionHref={`/leads/${lead.id}`}
            />
          </TabsContent>
          <TabsContent value="documents">
            <EmptyState
              title="No documents uploaded"
              description="Bank statements and underwriting files will be tracked here."
            />
          </TabsContent>
          <TabsContent value="notes">
            <EmptyState
              title="No notes yet"
              description="Rep notes and AI summaries will collect on this opportunity."
            />
          </TabsContent>
          <TabsContent value="intelligence">
            <Card>
              <CardHeader>
                <CardTitle>Recommended questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {recommendedQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadinessScore score={lead.status === "qualified" ? 72 : 38} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next Best Action</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {lead.status === "new"
              ? "Open the pre-call brief and start discovery."
              : "Advance qualification and schedule the next follow-up."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk Flags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="warning">Missing documents</Badge>
            <Badge variant="secondary">No completed call</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {likelyPains.length === 0 ? (
              <p>No pains inferred yet.</p>
            ) : (
              likelyPains.map((pain) => <p key={pain}>• {pain}</p>)
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 capitalize">{value}</p>
    </div>
  );
}
