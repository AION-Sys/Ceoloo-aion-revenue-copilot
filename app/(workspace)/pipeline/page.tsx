import Link from "next/link";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRepSession } from "@/lib/auth/session";
import { listLeadsForOrganization } from "@/lib/leads/repository";

const PIPELINE_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Discovery",
  "Documents Requested",
  "Documents Received",
  "Submitted",
  "Offer",
  "Closing",
  "Funded",
  "Lost",
] as const;

export default async function PipelinePage() {
  const repSession = await getRepSession();
  if (!repSession) return null;

  const leads = await listLeadsForOrganization(repSession.organizationId);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Move opportunities from first contact through funded outcomes.
        </p>
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = leads.filter((lead) =>
                stageMatchesLead(stage, lead.status ?? "new"),
              );
              return (
                <div
                  key={stage}
                  className="w-56 shrink-0 rounded-xl border bg-card"
                >
                  <div className="border-b px-3 py-2">
                    <p className="text-xs font-semibold">{stage}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {stageLeads.length}
                    </p>
                  </div>
                  <div className="space-y-2 p-2">
                    {stageLeads.length === 0 ? (
                      <p className="px-1 py-3 text-xs text-muted-foreground">
                        Empty
                      </p>
                    ) : (
                      stageLeads.map((lead) => (
                        <Link
                          key={lead.id}
                          href={`/pipeline/${lead.id}`}
                          className="block rounded-lg border p-2 transition-colors hover:bg-muted/50"
                        >
                          <p className="text-sm font-medium">
                            {lead.contactName ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lead.companyName}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          {leads.length === 0 ? (
            <EmptyState
              title="No opportunities yet"
              description="Add a lead to open the revenue pipeline."
              actionLabel="Add Lead"
              actionHref="/contacts"
            />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Prospect</th>
                    <th className="px-3 py-2 font-medium">Company</th>
                    <th className="px-3 py-2 font-medium">Stage</th>
                    <th className="px-3 py-2 font-medium">Owner</th>
                    <th className="px-3 py-2 font-medium">Next step</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        {lead.contactName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">{lead.companyName}</td>
                      <td className="px-3 py-2.5 capitalize">{lead.status}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">You</td>
                      <td className="px-3 py-2.5">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/pipeline/${lead.id}`}>Open</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function stageMatchesLead(
  stage: (typeof PIPELINE_STAGES)[number],
  status: string,
): boolean {
  if (stage === "New") return status === "new";
  if (stage === "Contacted") return status === "contacted";
  if (stage === "Qualified") return status === "qualified";
  if (stage === "Lost") return status === "closed";
  return false;
}
