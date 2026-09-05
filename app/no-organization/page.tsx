import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function NoOrganizationPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AION · Mission 002
          </p>
          <CardTitle className="text-xl">Organization not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Signed in as {user.email}, but this account is not linked to a sales
            organization yet.
          </p>
          <p className="text-muted-foreground">
            Ask an admin to add you to organization members for your team, then
            refresh.
          </p>
          <div className="flex gap-2">
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
            <Button asChild variant="ghost">
              <Link href="/login">Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
