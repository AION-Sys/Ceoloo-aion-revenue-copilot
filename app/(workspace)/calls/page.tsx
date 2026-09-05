import Link from "next/link";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRepSession } from "@/lib/auth/session";
import { listLeadsForOrganization } from "@/lib/leads/repository";

export default async function CallsPage() {
  const repSession = await getRepSession();
  if (!repSession) return null;

  const leads = await listLeadsForOrganization(repSession.organizationId);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calls</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review upcoming, completed, and needs-review conversations.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={leads[0] ? `/leads/${leads[0].id}` : "/contacts"}>
            Start Call
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search calls, contacts, companies…"
          className="max-w-sm"
          disabled
          aria-label="Search calls"
        />
        <p className="text-xs text-muted-foreground">
          Filters for date, rep, outcome, industry, intent, and stage land with call telemetry.
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Calls</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="review">Needs Review</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {leads.length === 0 ? (
            <EmptyState
              title="No calls yet"
              description="Start your first call to begin building Revenue Copilot intelligence."
              actionLabel="Start Call"
              actionHref="/contacts"
            />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Contact</th>
                    <th className="px-3 py-2 font-medium">Company</th>
                    <th className="px-3 py-2 font-medium">Stage</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5">{lead.contactName ?? "—"}</td>
                      <td className="px-3 py-2.5">{lead.companyName}</td>
                      <td className="px-3 py-2.5 capitalize">{lead.status}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        Ready for pre-call
                      </td>
                      <td className="px-3 py-2.5">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/leads/${lead.id}`}>Open</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="upcoming">
          <EmptyState
            title="No upcoming calls"
            description="Scheduled calls will appear here once calendar and task sync is connected."
          />
        </TabsContent>
        <TabsContent value="completed">
          <EmptyState
            title="No completed calls"
            description="Completed call reviews will list duration, sentiment, intent, and outcome."
          />
        </TabsContent>
        <TabsContent value="review">
          <EmptyState
            title="Nothing needs review"
            description="Calls awaiting post-call summary approval will land in this queue."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
