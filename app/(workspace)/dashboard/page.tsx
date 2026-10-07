import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { buildOverviewDashboard } from "@/lib/dashboard/overview";
import { listLeadsForOrganization } from "@/lib/leads/repository";
import { getRepSession } from "@/lib/auth/session";
import { DEMO_FOLLOW_UPS, isDemoOrganization } from "@/lib/cockpit/demo";
import { displayNameFromEmail, greetingForHour } from "@/lib/utils";

export default async function DashboardPage() {
  const repSession = await getRepSession();
  if (!repSession) {
    return null;
  }

  const leads = await listLeadsForOrganization(repSession.organizationId);
  const overview = buildOverviewDashboard(leads);
  const repName = displayNameFromEmail(repSession.email);
  const greeting = greetingForHour(new Date().getHours());
  const followUps = isDemoOrganization(repSession.organizationId) ? DEMO_FOLLOW_UPS : [];

  return (
    <CommandCenter
      greeting={greeting}
      repName={repName}
      overview={overview}
      followUps={followUps}
    />
  );
}
