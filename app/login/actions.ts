"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  credentialsMatchDemo,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_TOKEN,
  demoSessionCookieOptions,
  isDemoAuthEnabled,
} from "@/lib/auth/demo";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState = {
  error?: string;
};

export async function signInWithPassword(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/dashboard").trim() || "/dashboard";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (credentialsMatchDemo(email, password)) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_SESSION_COOKIE, DEMO_SESSION_TOKEN, demoSessionCookieOptions());
    redirect(nextPath.startsWith("/") ? nextPath : "/dashboard");
  }

  if (!getSupabasePublicEnv().ok) {
    if (isDemoAuthEnabled()) {
      return {
        error: "Invalid demo credentials. Use the preview rep email and password shown below.",
      };
    }
    return { error: "Supabase is not configured for this environment." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(nextPath.startsWith("/") ? nextPath : "/dashboard");
}
