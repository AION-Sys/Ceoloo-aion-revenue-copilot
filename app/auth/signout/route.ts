import { NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  demoSessionCookieOptions,
} from "@/lib/auth/demo";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);

  if (getSupabasePublicEnv().ok) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL("/login", requestUrl.origin), {
    status: 303,
  });
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    ...demoSessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
