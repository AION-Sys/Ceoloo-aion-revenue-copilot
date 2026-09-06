import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PreCallBriefPanel } from "@/components/PreCallBriefPanel";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Button } from "@/components/ui/button";
import { readDemoSessionFromCookies } from "@/lib/auth/demo";
import { getRepSession } from "@/lib/auth/session";
import { getPreCallBriefForLead } from "@/lib/intelligence/brief";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type LeadBriefPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadBriefPage({ params }: LeadBriefPageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const demoSession = await readDemoSessionFromCookies();
  if (!getSupabasePublicEnv().ok && !demoSession) {
    return (
      <EmptyState
        title="Pre-call brief unavailable"
        description="Supabase is not configured. Add project URL and anon key to load lead data."
        actionLabel="Back to dashboard"
        actionHref="/dashboard"
      />
    );
  }

  const { id } = await params;
  const result = await getPreCallBriefForLead(id, repSession.organizationId);

  if (!result.ok) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Workspace
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">{result.brief.lead.companyName}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Pre-call brief
          </h1>
        </div>
        <Button asChild size="sm">
          <Link href={`/calls`}>Start from calls</Link>
        </Button>
      </div>
      <PreCallBriefPanel brief={result.brief} />
    </div>
  );
}
