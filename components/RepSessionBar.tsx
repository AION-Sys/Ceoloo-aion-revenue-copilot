import Link from "next/link";
import type { RepSession } from "@/lib/auth/types";

type RepSessionBarProps = {
  session: RepSession;
};

export function RepSessionBar({ session }: RepSessionBarProps) {
  return (
    <div className="session-bar">
      <div className="session-meta">
        <span className="session-label">Signed in</span>
        <strong>{session.email}</strong>
        <span className="session-separator">·</span>
        <span>{session.organizationName}</span>
        <span className="session-role">{session.role}</span>
      </div>
      <div className="session-actions">
        <Link className="session-link" href="/login">
          Switch account
        </Link>
        <form action="/auth/signout" method="post">
          <button className="button button-secondary button-compact" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
