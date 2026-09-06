import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getAuthenticatedUser, getRepSession } from "@/lib/auth/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const repSession = await getRepSession();

  if (!repSession) {
    const user = await getAuthenticatedUser();
    if (user) {
      redirect("/no-organization");
    }
    redirect("/login?next=/dashboard");
  }

  return (
    <AppShell
      repEmail={repSession.email}
      organizationName={repSession.organizationName}
      role={repSession.role}
    >
      {children}
    </AppShell>
  );
}
