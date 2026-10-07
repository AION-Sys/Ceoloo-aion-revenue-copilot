"use client";

import { useState } from "react";
import Link from "next/link";
import { EvidenceStateBadge } from "@/components/cockpit/EvidenceStateBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  approveFollowUpDraft,
  confirmFollowUpDraft,
} from "@/lib/cockpit/follow-up";
import type { FollowUpDraft } from "@/lib/cockpit/types";

type FollowUpWorkspaceProps = {
  initialDrafts: FollowUpDraft[];
};

export function FollowUpWorkspacePanel({ initialDrafts }: FollowUpWorkspaceProps) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [confirmIds, setConfirmIds] = useState<Record<string, string>>({});

  if (drafts.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No follow-up drafts yet. Complete a post-call review to generate an approved-or-draft
          message here.
        </CardContent>
      </Card>
    );
  }

  function patch(id: string, next: FollowUpDraft) {
    setDrafts((current) => current.map((item) => (item.id === id ? next : item)));
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => (
        <Card key={draft.id}>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-base">
                {draft.contactName ?? draft.companyName}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {draft.companyName} · {draft.channel} · due{" "}
                {new Date(draft.dueAt).toLocaleString()}
              </p>
            </div>
            <EvidenceStateBadge state={draft.evidenceState} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Recommendation</p>
              <p className="text-sm">{draft.recommendation}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subject</p>
              <p className="text-sm font-medium">{draft.subject}</p>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
              {draft.body}
            </pre>
            {draft.externalConfirmationId ? (
              <p className="text-xs text-muted-foreground">
                External confirmation: {draft.externalConfirmationId}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Draft only — nothing has been sent or synced.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/prospects/${draft.leadId}`}>Open prospect</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  draft.evidenceState === "confirmed" ||
                  draft.evidenceState === "rejected"
                }
                onClick={() => patch(draft.id, approveFollowUpDraft(draft))}
              >
                Approve draft
              </Button>
            </div>
            {draft.evidenceState === "approved" ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Provider message id (required to confirm send)"
                  value={confirmIds[draft.id] ?? ""}
                  onChange={(event) =>
                    setConfirmIds((current) => ({
                      ...current,
                      [draft.id]: event.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    patch(
                      draft.id,
                      confirmFollowUpDraft(draft, confirmIds[draft.id] ?? ""),
                    )
                  }
                >
                  Mark sent (confirmed)
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
