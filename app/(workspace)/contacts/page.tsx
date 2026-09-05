import Link from "next/link";
import { EmptyState } from "@/components/primitives/EmptyState";
import { Button } from "@/components/ui/button";
import { getRepSession } from "@/lib/auth/session";
import { listLeadsForOrganization } from "@/lib/leads/repository";

export default async function ContactsPage() {
  const repSession = await getRepSession();
  if (!repSession) return null;

  const leads = await listLeadsForOrganization(repSession.organizationId);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People tied to revenue opportunities and call history.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard">Back to overview</Link>
        </Button>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          description="Import a prospect or add a lead to begin relationship timelines."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">{lead.contactName ?? "—"}</td>
                  <td className="px-3 py-2.5">{lead.companyName}</td>
                  <td className="px-3 py-2.5 capitalize">{lead.status}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">You</td>
                  <td className="px-3 py-2.5">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/contacts/${lead.id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
