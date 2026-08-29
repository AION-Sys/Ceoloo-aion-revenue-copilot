import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getAuthenticatedUser, getRepSession } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/";
  const repSession = await getRepSession();

  if (repSession) {
    redirect(nextPath);
  }

  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/no-organization");
  }

  return (
    <main className="page auth-page">
      <header className="header">
        <p className="eyebrow">AION · Mission 002</p>
        <h1>Rep sign in</h1>
        <p className="subtitle">Access the Revenue Conversion Copilot workspace.</p>
      </header>
      <LoginForm nextPath={nextPath} initialError={params.error} />
      <p className="auth-footnote">
        Need access? Contact your organization admin to provision a rep account.
      </p>
      <p className="auth-footnote">
        <Link href="/">Back to overview</Link>
      </p>
    </main>
  );
}
