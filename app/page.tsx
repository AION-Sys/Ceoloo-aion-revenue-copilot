import { redirect } from "next/navigation";
import { getAuthenticatedUser, getRepSession } from "@/lib/auth/session";

export default async function HomePage() {
  const repSession = await getRepSession();
  if (repSession) {
    redirect("/dashboard");
  }

  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/no-organization");
  }

  redirect("/login?next=/dashboard");
}
