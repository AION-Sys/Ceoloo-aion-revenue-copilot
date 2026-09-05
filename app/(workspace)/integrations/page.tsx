import { WorkspacePlaceholder } from "@/components/shell/WorkspacePlaceholder";

export default function IntegrationsPage() {
  return (
    <WorkspacePlaceholder
      title="Integrations"
      description="Connect CRM sync, telephony, and AION event infrastructure endpoints."
      emptyTitle="No integrations configured"
      emptyDescription="Supabase, AION AI Gateway, and learning ingest are configured via environment variables — UI connectors come later."
      actionLabel="Open settings"
      actionHref="/settings"
    />
  );
}
