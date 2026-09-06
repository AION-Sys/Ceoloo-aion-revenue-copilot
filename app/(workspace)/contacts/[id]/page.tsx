import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepSession } from "@/lib/auth/session";
import { getPreCallBriefForLead } from "@/lib/intelligence/brief";

type ContactPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContactDetailPage({ params }: ContactPageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const { id } = await params;
  const result = await getPreCallBriefForLead(id, repSession.organizationId);
  if (!result.ok) {
    notFound();
  }

  const { lead, context } = result.brief;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/contacts" className="hover:text-foreground">
              Contacts
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">
              {lead.contactName ?? lead.companyName}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {lead.contactName ?? "Unknown contact"}
          </h1>
          <p className="text-sm text-muted-foreground">{lead.companyName}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/leads/${lead.id}`}>Pre-call brief</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/pipeline/${lead.id}`}>Open deal</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Stage</p>
            <p className="capitalize">{lead.status}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Source</p>
            <p>{lead.source}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Industry</p>
            <p>{context.industry}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Offer</p>
            <p>{context.relevantOffer ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <EmptyState
        title="Relationship timeline"
        description="Calls, emails, documents, notes, applications, and follow-ups will appear chronologically here."
      />
    </div>
  );
}
