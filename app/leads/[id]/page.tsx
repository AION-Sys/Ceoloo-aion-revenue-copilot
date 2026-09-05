import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PreCallBriefPanel } from "@/components/PreCallBriefPanel";
import { RepSessionBar } from "@/components/RepSessionBar";
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
    redirect("/login?next=/");
  }

  const demoSession = await readDemoSessionFromCookies();
  if (!getSupabasePublicEnv().ok && !demoSession) {
    return (
      <main className="page">
        <RepSessionBar session={repSession} />
        <section className="card">
          <h1>Pre-call brief unavailable</h1>
          <p>Supabase is not configured. Add project URL and anon key to load lead data.</p>
          <Link className="session-link" href="/">
            Back to workspace
          </Link>
        </section>
      </main>
    );
  }

  const { id } = await params;
  const result = await getPreCallBriefForLead(id, repSession.organizationId);

  if (!result.ok) {
    notFound();
  }

  return (
    <main className="page">
      <RepSessionBar session={repSession} />
      <p className="breadcrumb">
        <Link href="/">Workspace</Link>
        <span className="session-separator">/</span>
        <span>{result.brief.lead.companyName}</span>
      </p>
      <PreCallBriefPanel brief={result.brief} />
    </main>
  );
}
