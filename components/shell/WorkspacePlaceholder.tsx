import { EmptyState } from "@/components/primitives/EmptyState";

type WorkspacePlaceholderProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel?: string;
  actionHref?: string;
};

export function WorkspacePlaceholder({
  title,
  description,
  emptyTitle,
  emptyDescription,
  actionLabel,
  actionHref,
}: WorkspacePlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />
    </div>
  );
}
