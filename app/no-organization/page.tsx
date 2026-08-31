import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function NoOrganizationPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page auth-page">
      <header className="header">
        <p className="eyebrow">AION · Mission 002</p>
        <h1>Organization not found</h1>
        <p className="subtitle">
          Signed in as {user.email}, but this account is not linked to a sales organization yet.
        </p>
      </header>
      <p className="auth-footnote">
        Ask an admin to add you to <code>organization_members</code> for your team, then refresh.
      </p>
      <form action="/auth/signout" method="post">
        <button className="button button-secondary" type="submit">
          Sign out
        </button>
      </form>
      <p className="auth-footnote">
        <Link href="/">Back to overview</Link>
      </p>
    </main>
  );
}
