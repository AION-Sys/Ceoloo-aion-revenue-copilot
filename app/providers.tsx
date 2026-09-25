"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import {
  POSTHOG_ENABLED,
  POSTHOG_KEY,
  maskUrl,
  posthogOptions,
} from "@/lib/analytics/posthog";

/**
 * App-wide PostHog provider. No-ops entirely when NEXT_PUBLIC_POSTHOG_KEY is
 * unset (local dev / CI / previews), so nothing is sent and children render
 * untouched. See lib/analytics/posthog.ts and aion-docs ADR-010 for the
 * PII-safe posture.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_ENABLED || typeof window === "undefined") return;
    if ((posthog as unknown as { __loaded?: boolean }).__loaded) return;
    posthog.init(POSTHOG_KEY as string, posthogOptions());
  }, []);

  if (!POSTHOG_ENABLED) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

/**
 * Manual, sanitized pageview capture for the App Router. We do this instead of
 * autocapture so query strings and id-like path segments never leak (maskUrl).
 * useSearchParams requires a Suspense boundary in Next 15, provided above.
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const client = usePostHog();

  useEffect(() => {
    if (!pathname || !client) return;
    client.capture("$pageview", {
      $current_url: maskUrl(window.location.href),
    });
    // searchParams is a dependency only to re-fire on in-page query changes;
    // its contents are intentionally not sent.
  }, [pathname, searchParams, client]);

  return null;
}
