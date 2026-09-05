import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasDemoSessionCookie } from "@/lib/auth/demo";
import { isProtectedPath } from "@/lib/auth/routes";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const env = getSupabasePublicEnv();
  const pathname = request.nextUrl.pathname;
  const hasDemoSession = hasDemoSessionCookie(request.cookies);

  if (!env.ok) {
    if (hasDemoSession && pathname === "/login") {
      const nextPath = request.nextUrl.searchParams.get("next") ?? "/dashboard";
      return NextResponse.redirect(
        new URL(nextPath.startsWith("/") ? nextPath : "/dashboard", request.url),
      );
    }

    if (
      !hasDemoSession &&
      isProtectedPath(pathname) &&
      pathname !== "/"
    ) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(env.env.url, env.env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSignedIn = Boolean(user) || hasDemoSession;

  if (isSignedIn && pathname === "/login") {
    const nextPath = request.nextUrl.searchParams.get("next") ?? "/dashboard";
    return NextResponse.redirect(
      new URL(nextPath.startsWith("/") ? nextPath : "/dashboard", request.url),
    );
  }

  if (!isSignedIn && isProtectedPath(pathname) && pathname !== "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
