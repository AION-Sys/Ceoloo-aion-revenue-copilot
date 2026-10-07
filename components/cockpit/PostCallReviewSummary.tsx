import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PostCallReview } from "@/lib/cockpit/post-call-review";
import { funnelStageLabel } from "@/lib/sales/motion";
import { cn } from "@/lib/utils";

type PostCallReviewSummaryProps = {
  review: PostCallReview;
};

export function PostCallReviewSummary({ review }: PostCallReviewSummaryProps) {
  const newlyConfirmed = review.qualificationDeltas.filter((d) => !d.before && d.after);
  const stillMissing = review.qualificationDeltas.filter((d) => !d.after);

  return (
    <Card className="border-ai/25">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Copilot review</CardTitle>
          <Badge variant={review.policy.allowPitch ? "success" : "secondary"}>
            {review.policy.allowPitch ? "Pitch allowed" : "Do not pitch"} ·{" "}
            {review.qualificationAfter.confirmed}/{review.qualificationAfter.total}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Canonical post-call object — evidence, stage recommendation, follow-up, and CRM drafts in
          one place. Nothing is sent or written until approved.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recommendation
          </h3>
          <p className="text-base font-medium leading-snug">
            {funnelStageLabel(review.recommendation.stageFrom)} →{" "}
            {review.recommendation.stageToLabel}
          </p>
          <p className="text-muted-foreground">{review.policy.rationale}</p>
          {review.recommendation.serviceHint ? (
            <p>
              Recommended next step:{" "}
              <span className="font-medium text-foreground">
                {review.recommendation.serviceHint}
              </span>
            </p>
          ) : null}
          {review.recommendation.nextAction ? (
            <p>
              Next action:{" "}
              <span className="font-medium text-foreground">
                {review.recommendation.nextAction}
              </span>
            </p>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Confirmed this call</p>
            <ul className="mt-2 space-y-1">
              {newlyConfirmed.length > 0 ? (
                newlyConfirmed.map((delta) => (
                  <li key={delta.flagId} className="flex items-start gap-2">
                    <span className="text-emerald-600" aria-hidden>
                      ✓
                    </span>
                    <span>{delta.label}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">No new flags confirmed vs prior profile.</li>
              )}
            </ul>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Still open</p>
            <ul className="mt-2 space-y-1">
              {stillMissing.slice(0, 5).map((delta) => (
                <li key={delta.flagId} className="flex items-start gap-2">
                  <span className="text-amber-600" aria-hidden>
                    ⚠
                  </span>
                  <span>{delta.label}</span>
                </li>
              ))}
              {stillMissing.length === 0 ? (
                <li className="text-muted-foreground">All qualification flags confirmed.</li>
              ) : null}
            </ul>
          </div>
        </section>

        {review.evidence.economicImpactSummary ? (
          <section className="space-y-1 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Economic impact
            </h3>
            <p className="font-medium leading-snug">{review.evidence.economicImpactSummary}</p>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What we learned
          </h3>
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            {review.learned.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {(review.objections.length > 0 ||
          review.buyingSignals.length > 0 ||
          review.commitments.length > 0) && (
          <section className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Objections</p>
              <ul className="mt-1 space-y-1">
                {review.objections.length === 0 ? (
                  <li className="text-muted-foreground">None</li>
                ) : (
                  review.objections.map((item) => (
                    <li key={item.objection}>
                      {item.objection}
                      {item.resolved ? (
                        <Badge className="ml-1" variant="secondary">
                          resolved
                        </Badge>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Buying signals</p>
              <ul className="mt-1 space-y-1">
                {review.buyingSignals.length === 0 ? (
                  <li className="text-muted-foreground">None captured</li>
                ) : (
                  review.buyingSignals.map((item) => <li key={item.id}>{item.text}</li>)
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Commitments</p>
              <ul className="mt-1 space-y-1">
                {review.commitments.length === 0 ? (
                  <li className="text-muted-foreground">None captured</li>
                ) : (
                  review.commitments.map((item) => <li key={item.id}>{item.text}</li>)
                )}
              </ul>
            </div>
          </section>
        )}

        <section
          className={cn(
            "rounded-lg border px-3 py-2.5",
            review.allCrmDraft ? "border-border bg-muted/20" : "border-ai/30 bg-ai/5",
          )}
        >
          <p className="font-medium">
            Proposed CRM changes: {review.proposedCrmChangeCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {review.allCrmDraft
              ? "All drafts — review & approve below. Follow-up remains unsent."
              : "Some proposals already have external confirmation ids."}{" "}
            Follow-up draft: <span className="font-medium">{review.followUp.subject}</span> —{" "}
            <Link href="/follow-up" className="text-ai hover:underline">
              open Follow-Up
            </Link>
            .
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
