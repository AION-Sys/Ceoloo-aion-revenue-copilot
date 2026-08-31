export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicEnv():
  | { ok: true; env: SupabasePublicEnv }
  | { ok: false; error: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return {
      ok: false,
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  return { ok: true, env: { url, anonKey } };
}

export function requireSupabasePublicEnv(): SupabasePublicEnv {
  const result = getSupabasePublicEnv();
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.env;
}
