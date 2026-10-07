import { Badge } from "@/components/ui/badge";
import type { ActionEvidenceState } from "@/lib/cockpit/types";

const LABELS: Record<ActionEvidenceState, string> = {
  draft: "Draft — not sent",
  approved: "Approved — awaiting external confirm",
  confirmed: "Confirmed externally",
  rejected: "Rejected",
};

type EvidenceStateBadgeProps = {
  state: ActionEvidenceState;
};

export function EvidenceStateBadge({ state }: EvidenceStateBadgeProps) {
  const variant =
    state === "confirmed"
      ? "success"
      : state === "rejected"
        ? "destructive"
        : state === "approved"
          ? "ai"
          : "secondary";

  return <Badge variant={variant}>{LABELS[state]}</Badge>;
}
