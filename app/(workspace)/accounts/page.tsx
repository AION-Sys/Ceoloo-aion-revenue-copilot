import { WorkspacePlaceholder } from "@/components/shell/WorkspacePlaceholder";

export default function AccountsPage() {
  return (
    <WorkspacePlaceholder
      title="Accounts"
      description="Company-level view of opportunities, financing context, and activity."
      emptyTitle="No accounts yet"
      emptyDescription="Accounts are derived from canonical lead and deal companies — add a prospect to populate this list."
      actionLabel="View contacts"
      actionHref="/contacts"
    />
  );
}
