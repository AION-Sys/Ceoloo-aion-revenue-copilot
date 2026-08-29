export type RepRole = "rep" | "manager" | "admin";

export type RepSession = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: RepRole;
};

export type OrganizationMembershipRow = {
  organization_id: string;
  role: RepRole;
  organizations: {
    name: string;
  } | null;
};
