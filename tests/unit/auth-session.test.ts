import { describe, expect, it } from "vitest";
import { isRepRole, mapMembershipToRepSession } from "@/lib/auth/session";
import type { OrganizationMembershipRow } from "@/lib/auth/types";

describe("rep session mapping", () => {
  const membership: OrganizationMembershipRow = {
    organization_id: "org-1",
    role: "rep",
    organizations: { name: "Acme HVAC Sales" },
  };

  it("maps organization membership to a rep session", () => {
    const session = mapMembershipToRepSession("user-1", "rep@example.com", membership);

    expect(session).toEqual({
      userId: "user-1",
      email: "rep@example.com",
      organizationId: "org-1",
      organizationName: "Acme HVAC Sales",
      role: "rep",
    });
  });

  it("rejects memberships without an organization name", () => {
    const session = mapMembershipToRepSession("user-1", "rep@example.com", {
      ...membership,
      organizations: null,
    });

    expect(session).toBeNull();
  });

  it("validates rep roles", () => {
    expect(isRepRole("rep")).toBe(true);
    expect(isRepRole("manager")).toBe(true);
    expect(isRepRole("admin")).toBe(true);
    expect(isRepRole("guest")).toBe(false);
  });
});
