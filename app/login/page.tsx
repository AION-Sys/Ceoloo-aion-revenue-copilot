import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDemoCredentials,
  isDemoAuthEnabled,
} from "@/lib/auth/demo";
import { getAuthenticatedUser, getRepSession } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/dashboard";
  const repSession = await getRepSession();

  if (repSession) {
    redirect(nextPath);
  }

  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/no-organization");
  }

  const demoEnabled = isDemoAuthEnabled();
  const demoCredentials = demoEnabled ? getDemoCredentials() : null;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AION · Mission 002
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Revenue Copilot
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to the rep workspace.
          </p>
        </div>

        {demoCredentials ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Preview rep (demo mode)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Email</span>{" "}
                {demoCredentials.email}
              </p>
              <p>
                <span className="text-muted-foreground">Password</span>{" "}
                {demoCredentials.password}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <LoginForm
              nextPath={nextPath}
              initialError={params.error}
              demoEmail={demoCredentials?.email}
              demoPassword={demoCredentials?.password}
            />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {demoCredentials
            ? "Demo mode is on for MVP testing. Disable with ENABLE_DEMO_AUTH=false when Supabase Auth is ready."
            : "Need access? Contact your organization admin to provision a rep account."}
        </p>
        <div className="text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Back</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
