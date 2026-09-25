import { describe, expect, it } from "vitest";
import { resolveCallOutcomeAccess } from "@/lib/outcomes/service";
import type { Lead } from "@/lib/sales/types";

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
};

describe("call outcome access", () => {
  it("returns not_found when lead is missing", () => {
    expect(resolveCallOutcomeAccess(null, "org-1")).toBe("not_found");
  });

  it("returns forbidden for cross-organization access", () => {
    expect(resolveCallOutcomeAccess(lead, "org-2")).toBe("forbidden");
  });

  it("returns ok when lead belongs to the rep organization", () => {
    expect(resolveCallOutcomeAccess(lead, "org-1")).toBe("ok");
  });
});
