/**
 * PostHog configuration for the Revenue Copilot — PII-safe by construction.
 *
 * Governance posture (aion-docs ADR-010): PostHog is the analytics /
 * experimentation / rollout plane that sits BESIDE the AION control plane, never
 * inside its trust boundary. It observes how humans use the app; it is not the
 * authority, the audit ledger, or the calibration source of truth. This app
 * handles tenant CRM data, so nothing here may ship contact PII to PostHog.
 *
 * Safeguards enforced here:
 *  - disabled entirely unless NEXT_PUBLIC_POSTHOG_KEY is set (safe default for
 *    local dev / CI / previews);
 *  - autocapture OFF, so CRM DOM text (names, emails on screen) is never sent;
 *  - manual, sanitized pageviews (query strings dropped, id-like path segments
 *    masked) — no lead/contact ids leak through URLs;
 *  - session recording OFF by default; when explicitly enabled it masks all
 *    inputs and all text;
 *  - person profiles only for identified users, keyed by stable non-PII ids;
 *  - a global sanitize pass that strips any property whose key looks sensitive;
 *  - traffic goes through a same-origin reverse proxy (/ingest) configured in
 *    next.config.ts, so the PostHog host and keys stay off the page.
 */
import type { PostHogConfig } from "posthog-js";

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/** PostHog is a no-op unless a project key is configured. */
export const POSTHOG_ENABLED = Boolean(POSTHOG_KEY);

/** Session replay is opt-in per environment and always masked when on. */
const SESSION_RECORDING_ENABLED =
  process.env.NEXT_PUBLIC_POSTHOG_SESSION_RECORDING === "true";

/**
 * Property keys that must never leave the browser. Any event property whose key
 * matches is dropped before send. Deliberately broad — favor losing an analytics
 * property over leaking CRM PII.
 */
const SENSITIVE_KEY = /(email|phone|name|address|ssn|dob|birth|password|passwd|token|secret|api[_-]?key|authorization|cookie|card|iban|account|contact|lead|customer|company_name|first_?name|last_?name)/i;

/** Replace id-like path segments (uuids, long numbers, hashes) with ":id". */
function maskPath(pathname: string): string {
  return pathname
    .split("/")
    .map((seg) =>
      /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(seg) || // uuid
      /^[0-9]{6,}$/.test(seg) || // long numeric id
      /^[0-9a-f]{16,}$/i.test(seg) // long hex/hash
        ? ":id"
        : seg,
    )
    .join("/");
}

/** Strip query + hash and mask id-like segments from a full URL. */
export function maskUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${maskPath(url.pathname)}`;
  } catch {
    return maskPath(rawUrl.split("?")[0]?.split("#")[0] ?? rawUrl);
  }
}

/** Drop sensitive-keyed properties and sanitize URL-bearing ones. */
export function scrubProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties ?? {})) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (
      typeof value === "string" &&
      (key === "$current_url" ||
        key === "$referrer" ||
        key === "$pathname" ||
        key === "$initial_current_url")
    ) {
      out[key] = maskUrl(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** Build the PII-safe posthog-js init options. */
export function posthogOptions(): Partial<PostHogConfig> {
  return {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com",
    // Identity: only create a person profile once we explicitly identify a user
    // by a stable non-PII id (see identifyActor). Anonymous traffic stays anon.
    person_profiles: "identified_only",
    // Never scrape the DOM — this app renders CRM data.
    autocapture: false,
    capture_pageview: false, // done manually + sanitized in the provider
    capture_pageleave: true,
    disable_session_recording: !SESSION_RECORDING_ENABLED,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
    },
    // Honor Do Not Track and scrub every outgoing property bag.
    respect_dnt: true,
    sanitize_properties: (properties) => scrubProperties(properties),
  };
}

export interface ActorIdentity {
  /** Stable, non-PII distinct id (e.g. Supabase user id). */
  distinctId: string;
  /** Tenant/org id for group analytics — never a company name. */
  tenantId?: string;
  /** Coarse role label (e.g. "rep", "manager"). No PII. */
  role?: string;
}

/**
 * Identify the current user by stable ids only. Call after auth. Deliberately
 * accepts no email/name — those never enter PostHog from this app.
 */
export function identifyActor(
  client: { identify: (id: string, props?: Record<string, unknown>) => void; group: (t: string, k: string) => void },
  actor: ActorIdentity,
): void {
  if (!actor.distinctId) return;
  client.identify(actor.distinctId, actor.role ? { role: actor.role } : {});
  if (actor.tenantId) client.group("tenant", actor.tenantId);
}
