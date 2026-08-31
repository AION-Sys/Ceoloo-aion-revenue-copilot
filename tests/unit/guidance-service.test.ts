import { describe, expect, it } from "vitest";
import { resolveCallGuidanceAccess } from "@/lib/intelligence/guidance";
import type { Lead } from "@/lib/sales/types";

const lead: Lead = {
  id: "lead-1",
  organizationId: "org-1",
  companyName: "Acme HVAC",
};

describe("call guidance access", () => {
  it("returns not_found when lead is missing", () => {
    expect(resolveCallGuidanceAccess(null, "org-1")).toBe("not_found");
  });

  it("returns forbidden for cross-organization access", () => {
    expect(resolveCallGuidanceAccess(lead, "org-2")).toBe("forbidden");
  });

  it("returns ok when lead belongs to the rep organization", () => {
    expect(resolveCallGuidanceAccess(lead, "org-1")).toBe("ok");
  });
});
