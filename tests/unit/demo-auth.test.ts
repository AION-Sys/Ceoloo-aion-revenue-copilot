import { afterEach, describe, expect, it, vi } from "vitest";
import {
  credentialsMatchDemo,
  getDemoCredentials,
  getDemoRepSession,
  isDemoAuthEnabled,
} from "@/lib/auth/demo";
import { listDemoLeadsForOrganization, getDemoLeadById } from "@/lib/demo/fixtures";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("demo auth", () => {
  it("auto-enables when Supabase public env is missing", () => {
    vi.stubEnv("ENABLE_DEMO_AUTH", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(isDemoAuthEnabled()).toBe(true);
  });

  it("respects ENABLE_DEMO_AUTH=false even without Supabase", () => {
    vi.stubEnv("ENABLE_DEMO_AUTH", "false");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(isDemoAuthEnabled()).toBe(false);
  });

  it("matches default demo credentials", () => {
    vi.stubEnv("ENABLE_DEMO_AUTH", "true");
    const { email, password } = getDemoCredentials();
    expect(credentialsMatchDemo(email, password)).toBe(true);
    expect(credentialsMatchDemo(email, "wrong")).toBe(false);
  });

  it("returns a rep session for Demo Contractor Co", () => {
    const session = getDemoRepSession();
    expect(session.organizationName).toBe("Demo Contractor Co");
    expect(session.role).toBe("rep");
    expect(session.email).toBe("rep@demo.local");
  });
});

describe("demo fixtures", () => {
  it("lists Acme HVAC for the demo organization", () => {
    const session = getDemoRepSession();
    const leads = listDemoLeadsForOrganization(session.organizationId);
    expect(leads).toHaveLength(1);
    expect(leads[0]?.companyName).toBe("Acme HVAC");
    expect(getDemoLeadById(leads[0]!.id)?.contactName).toBe("Jordan Lee");
  });
});
