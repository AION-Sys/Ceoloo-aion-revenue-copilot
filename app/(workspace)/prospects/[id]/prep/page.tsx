import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PreCallBriefPanel } from "@/components/PreCallBriefPanel";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Button } from "@/components/ui/button";
import { readDemoSessionFromCookies } from "@/lib/auth/demo";
import { getRepSession } from "@/lib/auth/session";
import { DEMO_QUALIFICATION_PROFILE, isDemoOrganization } from "@/lib/cockpit/demo";
import { getPreCallBriefForLead } from "@/lib/intelligence/brief";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

type PrepPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CallPrepPage({ params }: PrepPageProps) {
  const repSession = await getRepSession();
  if (!repSession) {
    redirect("/login?next=/dashboard");
  }

  const demoSession = await readDemoSessionFromCookies();
  if (!getSupabasePublicEnv().ok && !demoSession) {
    return (
      <EmptyState
        title="Call prep unavailable"
        description="Supabase is not configured. Add project URL and anon key to load lead data."
        actionLabel="Back to Today"
        actionHref="/dashboard"
      />
    );
  }

  const { id } = await params;
  const result = await getPreCallBriefForLead(id, repSession.organizationId);
  if (!result.ok) {
    notFound();
  }

  const demo = isDemoOrganization(result.brief.lead.organizationId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={`/prospects/${id}`} className="hover:text-foreground">
              Prospect
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Call prep</span>
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={`/prospects/${id}`}>Back to workspace</Link>
        </Button>
      </div>
      <PreCallBriefPanel
        brief={result.brief}
        profile={demo ? DEMO_QUALIFICATION_PROFILE : undefined}
      />
    </div>
  );
}
