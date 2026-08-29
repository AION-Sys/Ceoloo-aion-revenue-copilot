import { NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (!getSupabasePublicEnv().ok) {
    return NextResponse.redirect(
      new URL("/login?error=Supabase%20is%20not%20configured.", requestUrl.origin),
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent("Authentication failed.")}`, requestUrl.origin),
  );
}
