import type { NextConfig } from "next";

// Same-origin reverse proxy for PostHog (ADR-010): the browser talks to
// /ingest on our own origin, which we forward to PostHog. Keeps the PostHog
// host/keys off the page and avoids ad-blocker breakage. Defaults to US cloud;
// override with NEXT_PUBLIC_POSTHOG_HOST (e.g. EU cloud or a self-hosted host).
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(".i.posthog.com", "-assets.i.posthog.com");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      { source: "/ingest/:path*", destination: `${POSTHOG_HOST}/:path*` },
    ];
  },
  // Required for the /ingest/decide endpoint to work through the rewrite.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
