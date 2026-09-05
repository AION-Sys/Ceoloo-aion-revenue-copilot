import { cookies } from "next/headers";
import type { RepSession } from "@/lib/auth/types";

/** Cookie set after a successful demo rep sign-in. Edge-safe opaque token. */
export const DEMO_SESSION_COOKIE = "aion_demo_rep";
export const DEMO_SESSION_TOKEN = "demo-rep-v1";

export const DEMO_ORG_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_CONTEXT_ID = "22222222-2222-4222-8222-222222222222";
export const DEMO_LEAD_ID = "33333333-3333-4333-8333-333333333333";
export const DEMO_CALL_ID = "44444444-4444-4444-8444-444444444444";
export const DEMO_USER_ID = "55555555-5555-4555-8555-555555555555";

export const DEMO_REP_EMAIL_DEFAULT = "rep@demo.local";
export const DEMO_REP_PASSWORD_DEFAULT = "demo-rep-password";

/**
 * Demo auth is on by default for MVP validation testing.
 * Set ENABLE_DEMO_AUTH=false to disable once real Supabase Auth is the only path.
 * Explicit true/1 also enables it.
 */
export function isDemoAuthEnabled(): boolean {
  const flag = process.env.ENABLE_DEMO_AUTH?.trim().toLowerCase();
  if (flag === "false" || flag === "0") {
    return false;
  }
  if (flag === "true" || flag === "1") {
    return true;
  }
  // Default on for preview/MVP testing (including when Supabase is configured).
  return true;
}

export function getDemoCredentials(): { email: string; password: string } {
  return {
    email: process.env.SEED_REP_EMAIL?.trim() || DEMO_REP_EMAIL_DEFAULT,
    password: process.env.SEED_REP_PASSWORD?.trim() || DEMO_REP_PASSWORD_DEFAULT,
  };
}

export function getDemoRepSession(): RepSession {
  const { email } = getDemoCredentials();
  return {
    userId: DEMO_USER_ID,
    email,
    organizationId: DEMO_ORG_ID,
    organizationName: "Demo Contractor Co",
    role: "rep",
  };
}

export function credentialsMatchDemo(email: string, password: string): boolean {
  if (!isDemoAuthEnabled()) {
    return false;
  }
  const demo = getDemoCredentials();
  return (
    email.trim().toLowerCase() === demo.email.toLowerCase() && password === demo.password
  );
}

export function hasDemoSessionCookie(
  cookieStore: { get: (name: string) => { value: string } | undefined },
): boolean {
  if (!isDemoAuthEnabled()) {
    return false;
  }
  return cookieStore.get(DEMO_SESSION_COOKIE)?.value === DEMO_SESSION_TOKEN;
}

export async function readDemoSessionFromCookies(): Promise<RepSession | null> {
  if (!isDemoAuthEnabled()) {
    return null;
  }
  const cookieStore = await cookies();
  if (!hasDemoSessionCookie(cookieStore)) {
    return null;
  }
  return getDemoRepSession();
}

export function demoSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
