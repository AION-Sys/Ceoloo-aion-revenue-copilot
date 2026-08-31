import Link from "next/link";
import type { Lead } from "@/lib/sales/types";

type LeadListProps = {
  leads: Lead[];
};

export function LeadList({ leads }: LeadListProps) {
  if (leads.length === 0) {
    return (
      <section className="card lead-list-empty">
        <h2>Leads</h2>
        <p>No leads yet. Seed a lead in Supabase to exercise the pre-call brief workflow.</p>
      </section>
    );
  }

  return (
    <section className="card lead-list">
      <h2>Leads</h2>
      <ul className="lead-list-items">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link href={`/leads/${lead.id}`} className="lead-link">
              <span className="lead-company">{lead.companyName}</span>
              {lead.contactName ? (
                <span className="lead-contact">{lead.contactName}</span>
              ) : null}
              {lead.status ? <span className="lead-status">{lead.status}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
