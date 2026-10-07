import { FollowUpWorkspacePanel } from "@/components/cockpit/FollowUpWorkspace";
import { getRepSession } from "@/lib/auth/session";
import { DEMO_FOLLOW_UPS, isDemoOrganization } from "@/lib/cockpit/demo";

export default async function FollowUpPage() {
  const repSession = await getRepSession();
  if (!repSession) return null;

  const drafts = isDemoOrganization(repSession.organizationId) ? DEMO_FOLLOW_UPS : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Follow-Up</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve message drafts and tasks. Nothing is marked sent until an external
          confirmation id exists.
        </p>
      </div>
      <FollowUpWorkspacePanel initialDrafts={drafts} />
    </div>
  );
}
