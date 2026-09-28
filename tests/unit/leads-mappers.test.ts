import { describe, expect, it } from "vitest";
import {
  createDefaultBusinessContext,
  mapBusinessContextRow,
  mapLeadRow,
} from "@/lib/leads/mappers";

describe("lead mappers", () => {
  it("maps lead rows to domain types", () => {
    const lead = mapLeadRow({
      id: "lead-1",
      organization_id: "org-1",
      business_context_id: "ctx-1",
      company_name: "Acme HVAC",
      contact_name: "Jordan Lee",
      source: "outbound",
      status: "lead",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    expect(lead.companyName).toBe("Acme HVAC");
    expect(lead.contactName).toBe("Jordan Lee");
    expect(lead.businessContextId).toBe("ctx-1");
  });

  it("maps business context rows to domain types", () => {
    const context = mapBusinessContextRow({
      id: "ctx-1",
      organization_id: "org-1",
      industry: "home services",
      existing_systems: ["spreadsheets", "QuickBooks"],
      workflow_problems: ["manual lead follow-up"],
      recommended_service: "workflow automation implementation",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });

    expect(context.workflowProblems).toEqual(["manual lead follow-up"]);
    expect(context.existingSystems).toEqual(["spreadsheets", "QuickBooks"]);
    expect(context.recommendedService).toBe("workflow automation implementation");
  });

  it("creates a default business context when none is linked", () => {
    const context = createDefaultBusinessContext("org-1");
    expect(context.organizationId).toBe("org-1");
    expect(context.workflowProblems).toEqual([]);
    expect(context.existingSystems).toEqual([]);
  });
});
