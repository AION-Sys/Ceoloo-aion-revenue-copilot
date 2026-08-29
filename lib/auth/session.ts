import type { OrganizationMembershipRow, RepRole, RepSession } from "@/lib/auth/types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function mapMembershipToRepSession(
  userId: string,
  email: string,
  membership: OrganizationMembershipRow,
): RepSession | null {
  const organizationName = membership.organizations?.name?.trim();
  if (!organizationName) {
    return null;
  }

  return {
    userId,
    email,
    organizationId: membership.organization_id,
    organizationName,
    role: membership.role,
  };
}

export function isRepRole(value: string): value is RepRole {
  return value === "rep" || value === "manager" || value === "admin";
}

export async function getRepSession(): Promise<RepSession | null> {
  if (!getSupabasePublicEnv().ok) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return null;
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError || !memberships?.length) {
    return null;
  }

  const membership = memberships[0] as OrganizationMembershipRow;
  if (!isRepRole(membership.role)) {
    return null;
  }

  return mapMembershipToRepSession(user.id, user.email, membership);
}

export async function getAuthenticatedUser() {
  if (!getSupabasePublicEnv().ok) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  return user;
}
