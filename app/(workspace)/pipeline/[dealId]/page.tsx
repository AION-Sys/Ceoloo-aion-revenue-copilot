import { redirect } from "next/navigation";

type DealPageProps = {
  params: Promise<{ dealId: string }>;
};

export default async function DealRedirectPage({ params }: DealPageProps) {
  const { dealId } = await params;
  redirect(`/prospects/${dealId}`);
}
