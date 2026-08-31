import type { PreCallBrief } from "@/lib/intelligence/pre-call";
import { startCallForLead } from "@/app/leads/[id]/actions";

type PreCallBriefPanelProps = {
  brief: PreCallBrief;
};

export function PreCallBriefPanel({ brief }: PreCallBriefPanelProps) {
  const { lead, context, recommendedQuestions } = brief;

  return (
    <section className="brief-panel">
      <header className="brief-header">
        <p className="eyebrow">Pre-call brief</p>
        <h1>{lead.companyName}</h1>
        {lead.contactName ? <p className="subtitle">Contact: {lead.contactName}</p> : null}
      </header>

      <div className="brief-grid">
        <article className="card">
          <h2>Lead intelligence</h2>
          <ul>
            <li>Status: {lead.status ?? "new"}</li>
            {lead.source ? <li>Source: {lead.source}</li> : null}
            <li>Industry: {context.industry}</li>
          </ul>
        </article>

        <article className="card">
          <h2>Likely pains</h2>
          {context.likelyPains.length > 0 ? (
            <ul>
              {context.likelyPains.map((pain) => (
                <li key={pain}>{pain}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No pains recorded yet.</p>
          )}
        </article>

        <article className="card">
          <h2>Relevant offer</h2>
          <p className="muted">{context.relevantOffer ?? "No offer configured for this context."}</p>
        </article>
      </div>

      <article className="card brief-questions">
        <h2>Recommended questions</h2>
        <ol>
          {recommendedQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </article>

      <form action={startCallForLead.bind(null, lead.id)} className="call-actions">
        <button className="button" type="submit">
          Start call
        </button>
      </form>
    </section>
  );
}
