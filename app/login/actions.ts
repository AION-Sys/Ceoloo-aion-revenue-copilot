"use server";

import { redirect } from "next/navigation";
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
  const nextPath = String(formData.get("next") ?? "/").trim() || "/";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!getSupabasePublicEnv().ok) {
    return { error: "Supabase is not configured for this environment." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(nextPath.startsWith("/") ? nextPath : "/");
}
