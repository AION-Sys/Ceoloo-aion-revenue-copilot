import Link from "next/link";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Button } from "@/components/ui/button";
import { getRepSession } from "@/lib/auth/session";
import { listLeadsForOrganization } from "@/lib/leads/repository";
import { funnelStageLabel } from "@/lib/sales/motion";

export default async function ProspectsPage() {
  const repSession = await getRepSession();
  if (!repSession) return null;

  const leads = await listLeadsForOrganization(repSession.organizationId);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a prospect workspace — context, history, qualification, and next move.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard">Back to Today</Link>
        </Button>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="No prospects yet"
          description="Add or import a lead to start the Prepare → Call → Follow Up loop."
          actionLabel="Open Today"
          actionHref="/dashboard"
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">
                  {lead.contactName ?? "Unknown contact"}
                </p>
                <p className="text-xs text-muted-foreground">{lead.companyName}</p>
                <p className="mt-1 text-xs">
                  Stage: {funnelStageLabel(lead.status)}
                  {lead.source ? ` · ${lead.source}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/prospects/${lead.id}`}>Workspace</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/prospects/${lead.id}/prep`}>Call prep</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
