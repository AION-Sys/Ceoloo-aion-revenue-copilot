import { redirect } from "next/navigation";

type ContactPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContactRedirectPage({ params }: ContactPageProps) {
  const { id } = await params;
  redirect(`/prospects/${id}`);
}
