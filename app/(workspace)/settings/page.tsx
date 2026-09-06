import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const repSession = await getRepSession();
  if (!repSession) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace preferences for Revenue Copilot.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">
              Switch between light, dark, and system.
            </p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rep profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-3 border-b py-2">
            <span className="text-muted-foreground">Email</span>
            <span>{repSession.email}</span>
          </div>
          <div className="flex justify-between gap-3 border-b py-2">
            <span className="text-muted-foreground">Organization</span>
            <span>{repSession.organizationName}</span>
          </div>
          <div className="flex justify-between gap-3 py-2">
            <span className="text-muted-foreground">Role</span>
            <span className="capitalize">{repSession.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
