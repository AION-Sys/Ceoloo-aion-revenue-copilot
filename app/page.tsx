import Link from "next/link";
import { redirect } from "next/navigation";
import { LeadList } from "@/components/LeadList";
import { RepSessionBar } from "@/components/RepSessionBar";
import { WorkflowPhase } from "@/components/WorkflowPhase";
import { getAuthenticatedUser, getRepSession } from "@/lib/auth/session";
import { listLeadsForOrganization } from "@/lib/leads/repository";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const phases = [
  {
    id: "pre-call",
    title: "Before conversation",
    items: [
      "Lead intelligence",
      "Likely pains",
      "Relevant offer",
      "Recommended questions",
    ],
  },
  {
    id: "during-call",
    title: "During conversation",
    items: [
      "Script guidance",
      "Discovery checklist",
      "Objection detection",
      "Qualification capture",
      "Next-best action",
    ],
  },
  {
    id: "post-call",
    title: "After conversation",
    items: [
      "Structured outcome",
      "CRM event",
      "Learning event",
      "Next action",
    ],
  },
] as const;

export default async function HomePage() {
  const repSession = await getRepSession();

  if (!repSession) {
    const user = await getAuthenticatedUser();
    if (user) {
      redirect("/no-organization");
    }
  }

  const leads =
    repSession && getSupabasePublicEnv().ok
      ? await listLeadsForOrganization(repSession.organizationId)
      : [];

  return (
    <main className="page">
      {repSession ? <RepSessionBar session={repSession} /> : null}
      <header className="header">
        <p className="eyebrow">AION · Mission 002</p>
        <h1>Revenue Conversion Copilot</h1>
        <p className="subtitle">
          AI-assisted sales workspace — pre-call → call → post-call
        </p>
      </header>
      {!repSession ? (
        <section className="cta-panel">
          <p>Sign in to access lead and call workflows protected by organization-scoped RLS.</p>
          <Link className="button" href="/login?next=/">
            Rep sign in
          </Link>
        </section>
      ) : (
        <>
          <LeadList leads={leads} />
          <section className="grid">
            {phases.map((phase) => (
              <WorkflowPhase key={phase.id} title={phase.title} items={phase.items} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
