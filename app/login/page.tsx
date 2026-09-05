import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
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
  const nextPath = params.next?.startsWith("/") ? params.next : "/";
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
    <main className="page auth-page">
      <header className="header">
        <p className="eyebrow">AION · Mission 002</p>
        <h1>Rep sign in</h1>
        <p className="subtitle">Access the Revenue Conversion Copilot workspace.</p>
      </header>
      {demoCredentials ? (
        <section className="demo-creds" aria-label="Preview rep credentials">
          <p className="demo-creds-label">Preview rep (demo mode)</p>
          <p>
            <span className="demo-creds-key">Email</span> {demoCredentials.email}
          </p>
          <p>
            <span className="demo-creds-key">Password</span> {demoCredentials.password}
          </p>
        </section>
      ) : null}
      <LoginForm
        nextPath={nextPath}
        initialError={params.error}
        demoEmail={demoCredentials?.email}
        demoPassword={demoCredentials?.password}
      />
      <p className="auth-footnote">
        {demoCredentials
          ? "Demo mode is active until Supabase Auth is configured. Turn off with ENABLE_DEMO_AUTH=false."
          : "Need access? Contact your organization admin to provision a rep account."}
      </p>
      <p className="auth-footnote">
        <Link href="/">Back to overview</Link>
      </p>
    </main>
  );
}
