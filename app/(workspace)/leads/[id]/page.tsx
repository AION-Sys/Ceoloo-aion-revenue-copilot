import { redirect } from "next/navigation";

type LeadBriefPageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy route — Call Prep now lives under Prospects. */
export default async function LeadBriefRedirectPage({ params }: LeadBriefPageProps) {
  const { id } = await params;
  redirect(`/prospects/${id}/prep`);
}
