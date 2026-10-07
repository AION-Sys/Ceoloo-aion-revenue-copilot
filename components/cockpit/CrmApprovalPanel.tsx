"use client";

import { useState } from "react";
import { EvidenceStateBadge } from "@/components/cockpit/EvidenceStateBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  approveCrmProposal,
  confirmCrmProposal,
  rejectCrmProposal,
} from "@/lib/cockpit/crm-proposals";
import type { CrmChangeProposal } from "@/lib/cockpit/types";

type CrmApprovalPanelProps = {
  initialProposals: CrmChangeProposal[];
};

export function CrmApprovalPanel({ initialProposals }: CrmApprovalPanelProps) {
  const [proposals, setProposals] = useState(initialProposals);
  const [confirmIds, setConfirmIds] = useState<Record<string, string>>({});

  if (proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proposed CRM updates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No CRM writes proposed. Saves stay local until a draft is created and externally
            confirmed.
          </p>
        </CardContent>
      </Card>
    );
  }

  function patch(id: string, next: CrmChangeProposal) {
    setProposals((current) => current.map((item) => (item.id === id ? next : item)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposed CRM updates</CardTitle>
        <p className="text-sm text-muted-foreground">
          Human approval required. Never treat a draft as written to GHL/CRM.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="space-y-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{proposal.field}</p>
              <EvidenceStateBadge state={proposal.evidenceState} />
            </div>
            <p className="text-xs text-muted-foreground">{proposal.reason}</p>
            <p className="text-sm">
              <span className="text-muted-foreground">{proposal.fromValue}</span>
              <span className="mx-2">→</span>
              <span className="font-medium">{proposal.toValue}</span>
            </p>
            {proposal.externalConfirmationId ? (
              <p className="text-xs text-muted-foreground">
                External id: {proposal.externalConfirmationId}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  proposal.evidenceState === "confirmed" ||
                  proposal.evidenceState === "rejected"
                }
                onClick={() => patch(proposal.id, approveCrmProposal(proposal))}
              >
                Approve draft
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={proposal.evidenceState === "confirmed"}
                onClick={() => patch(proposal.id, rejectCrmProposal(proposal))}
              >
                Reject
              </Button>
            </div>
            {proposal.evidenceState === "approved" ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="External confirmation id (required)"
                  value={confirmIds[proposal.id] ?? ""}
                  onChange={(event) =>
                    setConfirmIds((current) => ({
                      ...current,
                      [proposal.id]: event.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    patch(
                      proposal.id,
                      confirmCrmProposal(proposal, confirmIds[proposal.id] ?? ""),
                    )
                  }
                >
                  Mark confirmed
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
